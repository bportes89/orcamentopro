import { createClient } from "npm:@supabase/supabase-js@2";

type RevenueCatEvent = {
  id?: string;
  type?: string;
  api_version?: string;
  app_user_id?: string;
  original_app_user_id?: string;
  entitlement_id?: string;
  entitlement_ids?: string[] | null;
  product_id?: string;
  period_type?: string;
  expiration_at_ms?: number | null;
  grace_period_expiration_at_ms?: number | null;
  event_timestamp_ms?: number;
  original_transaction_id?: string;
  store?: string;
};

type RevenueCatBody = {
  event?: RevenueCatEvent;
};

type Status =
  | "inactive"
  | "active"
  | "trialing"
  | "grace_period"
  | "billing_issue"
  | "canceled"
  | "expired";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function constanteIgual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let diferenca = 0;

  for (let indice = 0; indice < a.length; indice += 1) {
    diferenca |= a.charCodeAt(indice) ^ b.charCodeAt(indice);
  }

  return diferenca === 0;
}

async function verificarAssinatura(
  corpo: string,
  cabecalho: string | null,
  segredo: string,
): Promise<boolean> {
  if (!cabecalho) {
    return false;
  }

  const partes = Object.fromEntries(
    cabecalho.split(",").map((parte) => {
      const indice = parte.indexOf("=");
      return [parte.slice(0, indice), parte.slice(indice + 1)];
    }),
  );
  const timestamp = partes.t;
  const esperada = partes.v1;

  if (!timestamp || !esperada) {
    return false;
  }

  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) {
    return false;
  }

  const codificador = new TextEncoder();
  const chave = await crypto.subtle.importKey(
    "raw",
    codificador.encode(segredo),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const assinatura = await crypto.subtle.sign(
    "HMAC",
    chave,
    codificador.encode(`${timestamp}.${corpo}`),
  );
  const calculada = Array.from(new Uint8Array(assinatura))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return constanteIgual(calculada, esperada);
}

async function autorizado(req: Request, corpo: string): Promise<boolean> {
  const segredo = Deno.env.get("REVENUECAT_WEBHOOK_SECRET");

  if (!segredo) {
    return false;
  }

  const autorizacao = req.headers.get("authorization") ?? "";

  if (!constanteIgual(autorizacao, `Bearer ${segredo}`)) {
    return false;
  }

  const segredoAssinatura = Deno.env.get(
    "REVENUECAT_WEBHOOK_SIGNING_SECRET",
  );

  if (segredoAssinatura) {
    return verificarAssinatura(
      corpo,
      req.headers.get("x-revenuecat-webhook-signature"),
      segredoAssinatura,
    );
  }

  return true;
}

function possuiPro(evento: RevenueCatEvent): boolean {
  const entitlements = evento.entitlement_ids ??
    (evento.entitlement_id ? [evento.entitlement_id] : []);

  return (
    entitlements.includes("pro") ||
    evento.product_id === "orcamento_pro_mensal"
  );
}

function mapearStatus(evento: RevenueCatEvent): Status {
  if (evento.type === "EXPIRATION" || evento.type === "NON_RENEWING_PURCHASE") {
    return "expired";
  }

  if (evento.type === "BILLING_ISSUE") {
    const tolerancia = evento.grace_period_expiration_at_ms;

    return tolerancia && tolerancia > Date.now()
      ? "grace_period"
      : "billing_issue";
  }

  if (
    evento.type === "CANCELLATION" ||
    evento.type === "SUBSCRIPTION_PAUSED"
  ) {
    return "canceled";
  }

  if (evento.period_type === "TRIAL") {
    return "trialing";
  }

  return "active";
}

function paraIso(milissegundos: number | null | undefined): string | null {
  if (typeof milissegundos !== "number") {
    return null;
  }

  return new Date(milissegundos).toISOString();
}

function mapearPlataforma(loja: string | undefined): string | null {
  if (loja === "APP_STORE" || loja === "MAC_APP_STORE") {
    return "ios";
  }

  if (loja === "PLAY_STORE") {
    return "android";
  }

  if (loja === "RC_BILLING" || loja === "STRIPE") {
    return "web";
  }

  return loja?.toLowerCase() ?? null;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return json({ error: "Método não permitido." }, 405);
  }

  const corpo = await req.text();

  if (!(await autorizado(req, corpo))) {
    return json({ error: "Não autorizado." }, 401);
  }

  let body: RevenueCatBody;

  try {
    body = JSON.parse(corpo) as RevenueCatBody;
  } catch {
    return json({ error: "JSON inválido." }, 400);
  }

  const evento = body.event;

  if (!evento || evento.type === "TEST") {
    return json({ ok: true, ignorado: true });
  }

  const userId = evento.app_user_id ?? evento.original_app_user_id;

  if (!userId || !UUID_REGEX.test(userId)) {
    return json({ ok: true, ignorado: true });
  }

  if (!evento.id) {
    return json({ error: "Evento sem identificador." }, 400);
  }

  const url = Deno.env.get("SUPABASE_URL");
  const chaveServico = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !chaveServico) {
    return json({ error: "Configuração do servidor incompleta." }, 500);
  }

  const admin = createClient(url, chaveServico, {
    auth: { persistSession: false },
  });

  const { data: registrado, error: erroIdempotencia } = await admin
    .from("revenuecat_webhook_events")
    .insert({ id: evento.id })
    .select("id")
    .maybeSingle();

  if (erroIdempotencia) {
    return json({ error: "Falha ao registrar o evento." }, 500);
  }

  if (!registrado) {
    return json({ ok: true, duplicado: true });
  }

  if (!possuiPro(evento)) {
    return json({ ok: true, ignorado: true });
  }

  const status = mapearStatus(evento);
  const expiracao =
    status === "grace_period"
      ? paraIso(evento.grace_period_expiration_at_ms)
      : paraIso(evento.expiration_at_ms);

  const { error } = await admin.from("subscriptions").upsert(
    {
      user_id: userId,
      status,
      plan: "pro",
      expires_at: expiracao,
      platform: mapearPlataforma(evento.store),
      original_transaction_id: evento.original_transaction_id ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    return json({ error: "Falha ao salvar a assinatura." }, 500);
  }

  return json({ ok: true, status });
});

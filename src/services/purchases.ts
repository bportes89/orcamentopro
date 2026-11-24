import { Platform } from "react-native";
import Purchases, {
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type CustomerInfoUpdateListener,
  type PurchasesEntitlementInfo,
  type PurchasesOfferings,
  type PurchasesPackage,
} from "react-native-purchases";

import {
  notificarAssinaturaAlterada,
  obterAssinaturaLocal,
  salvarAssinaturaLocal,
} from "@/services/subscription";

export const ENTITLEMENT_PRO = "pro";
export const PRODUTO_MENSAL = "orcamento_pro_mensal";

export type TipoErroCompra =
  | "cancelado"
  | "pendente"
  | "rede"
  | "ja_assinado"
  | "erro";

type StatusAssinatura =
  | "inactive"
  | "active"
  | "trialing"
  | "grace_period"
  | "billing_issue"
  | "canceled"
  | "expired";

let usuarioConfigurado: string | null = null;

function chaveApi(): string | null {
  if (Platform.OS === "ios") {
    return process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? null;
  }

  if (Platform.OS === "android") {
    return process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? null;
  }

  return null;
}

function mapearLoja(loja: string): string | null {
  if (loja === "APP_STORE" || loja === "MAC_APP_STORE") {
    return "ios";
  }

  if (loja === "PLAY_STORE") {
    return "android";
  }

  if (loja === "RC_BILLING" || loja === "STRIPE") {
    return "web";
  }

  return loja.toLowerCase();
}

function mapearStatus(entitlement: PurchasesEntitlementInfo): StatusAssinatura {
  if (entitlement.billingIssueDetectedAt) {
    return entitlement.isActive ? "grace_period" : "billing_issue";
  }

  if (
    entitlement.unsubscribeDetectedAt &&
    !entitlement.willRenew &&
    entitlement.isActive
  ) {
    return "canceled";
  }

  if (entitlement.periodType === "TRIAL") {
    return "trialing";
  }

  return entitlement.isActive ? "active" : "expired";
}

export function espelharCustomerInfo(
  userId: string,
  info: CustomerInfo,
): void {
  const entitlement = info.entitlements.active[ENTITLEMENT_PRO];
  const anterior = obterAssinaturaLocal(userId);

  if (!entitlement) {
    salvarAssinaturaLocal(userId, {
      status: "inactive",
      plan: "free",
      expires_at: null,
      platform: null,
      original_transaction_id: anterior?.originalTransactionId ?? null,
    });
    notificarAssinaturaAlterada();
    return;
  }

  salvarAssinaturaLocal(userId, {
    status: mapearStatus(entitlement),
    plan: "pro",
    expires_at: entitlement.expirationDate,
    platform: mapearLoja(entitlement.store),
    original_transaction_id: anterior?.originalTransactionId ?? null,
  });
  notificarAssinaturaAlterada();
}

export async function configurarCompras(userId: string): Promise<boolean> {
  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }

  const apiKey = chaveApi();

  if (!apiKey) {
    return false;
  }

  try {
    if (!(await Purchases.isConfigured())) {
      Purchases.configure({
        apiKey,
        appUserID: userId,
      } as Parameters<typeof Purchases.configure>[0]);
      usuarioConfigurado = userId;
      return true;
    }

    if (usuarioConfigurado !== userId) {
      const resultado = await Purchases.logIn(userId);
      usuarioConfigurado = userId;
      espelharCustomerInfo(userId, resultado.customerInfo);
      return true;
    }

    return true;
  } catch {
    return false;
  }
}

export function estaConfiguradoPara(userId: string): boolean {
  return usuarioConfigurado === userId;
}

export async function sincronizarEstadoRevenueCat(
  userId: string,
): Promise<CustomerInfo | null> {
  if (!(await configurarCompras(userId))) {
    return null;
  }

  try {
    const info = await Purchases.getCustomerInfo();
    espelharCustomerInfo(userId, info);
    return info;
  } catch {
    return null;
  }
}

export function registrarOuvinteAssinatura(
  userId: string,
  aoAtualizar?: (info: CustomerInfo) => void,
): () => void {
  const ouvinte: CustomerInfoUpdateListener = (info: CustomerInfo) => {
    espelharCustomerInfo(userId, info);
    aoAtualizar?.(info);
  };

  Purchases.addCustomerInfoUpdateListener(ouvinte);

  return () => {
    Purchases.removeCustomerInfoUpdateListener(ouvinte);
  };
}

export async function getOfferings(): Promise<PurchasesOfferings | null> {
  try {
    return await Purchases.getOfferings();
  } catch {
    return null;
  }
}

export function obterPacoteMensal(
  offerings: PurchasesOfferings | null,
): PurchasesPackage | null {
  const pacotes = offerings?.current?.availablePackages ?? [];

  return (
    pacotes.find((pacote) => pacote.product.identifier === PRODUTO_MENSAL) ??
    pacotes[0] ??
    null
  );
}

export async function purchase(
  userId: string,
  pacote: PurchasesPackage,
): Promise<CustomerInfo> {
  const resultado = await Purchases.purchasePackage(pacote);
  espelharCustomerInfo(userId, resultado.customerInfo);
  return resultado.customerInfo;
}

export async function restore(userId: string): Promise<CustomerInfo> {
  const info = await Purchases.restorePurchases();
  espelharCustomerInfo(userId, info);
  return info;
}

function codigoDoErro(error: unknown): string | null {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string"
  ) {
    return (error as { code: string }).code;
  }

  return null;
}

export function tipoErroCompra(error: unknown): TipoErroCompra {
  const codigo = codigoDoErro(error);

  if (codigo === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
    return "cancelado";
  }

  if (codigo === PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR) {
    return "pendente";
  }

  if (
    codigo === PURCHASES_ERROR_CODE.NETWORK_ERROR ||
    codigo === PURCHASES_ERROR_CODE.OFFLINE_CONNECTION_ERROR ||
    codigo === PURCHASES_ERROR_CODE.PRODUCT_REQUEST_TIMED_OUT_ERROR
  ) {
    return "rede";
  }

  if (codigo === PURCHASES_ERROR_CODE.PRODUCT_ALREADY_PURCHASED_ERROR) {
    return "ja_assinado";
  }

  return "erro";
}

export function mensagemErroCompra(error: unknown): string {
  switch (tipoErroCompra(error)) {
    case "cancelado":
      return "A compra foi cancelada. Nada foi alterado na sua conta.";
    case "pendente":
      return "O pagamento está pendente. Confirmaremos assim que a loja processar.";
    case "rede":
      return "Sem conexão com a loja. Verifique sua internet e tente novamente.";
    case "ja_assinado":
      return "Você já possui esta assinatura. Use Restaurar compra se necessário.";
    default:
      return "Não foi possível concluir a compra. Tente novamente em instantes.";
  }
}

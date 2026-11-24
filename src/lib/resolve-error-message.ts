import * as Sentry from "@sentry/react-native";

const FALLBACK_MESSAGE =
  "Não foi possível concluir a operação. Tente novamente em instantes.";

const MESSAGES_BY_CODE: Record<string, string> = {
  PGRST116: "Não encontramos o registro solicitado.",
  PGRST301: "Sua sessão expirou. Entre novamente para continuar.",
  PGRST302: "Você não tem permissão para acessar estes dados.",
  PGRST205: "O serviço está temporariamente indisponível.",
  PGRST000: "Não foi possível acessar o servidor. Tente novamente.",
  PGRST003: "Não foi possível acessar o servidor. Tente novamente.",
  "401": "Sua sessão expirou. Entre novamente para continuar.",
  "403": "Você não tem permissão para acessar estes dados.",
  "404": "Não encontramos o registro solicitado.",
  "408": "O servidor demorou para responder. Tente novamente.",
  "409": "Esse registro já existe ou foi alterado. Atualize a tela e tente de novo.",
  "429": "Muitas tentativas. Aguarde um instante e tente novamente.",
  "500": "O servidor está com problemas. Tente novamente mais tarde.",
  "503": "O serviço está temporariamente indisponível.",
  "08001": "Não foi possível conectar ao servidor. Verifique sua internet.",
  "08006": "A conexão com o servidor foi perdida. Tente novamente.",
  "22P02": "Revise os dados informados e tente novamente.",
  "23502": "Preencha todos os campos obrigatórios.",
  "23503": "Não foi possível excluir ou alterar: há registros vinculados.",
  "23505": "Já existe um registro com esses dados.",
  "23514": "Revise os dados informados e tente novamente.",
  "42501": "Você não tem permissão para realizar esta operação.",
  "42P01": "O serviço está temporariamente indisponível.",
  "57014": "A operação demorou demais. Tente novamente.",
  invalid_credentials: "E-mail ou senha inválidos.",
  email_not_confirmed: "Confirme seu e-mail antes de continuar.",
  email_address_invalid: "Informe um e-mail válido.",
  user_already_exists: "Este e-mail já está cadastrado. Faça login.",
  weak_password: "A senha é muito fraca. Use pelo menos 6 caracteres.",
  same_password: "A nova senha deve ser diferente da atual.",
  over_email_send_rate_limit:
    "Muitos envios em pouco tempo. Aguarde alguns minutos e tente novamente.",
  over_request_rate_limit:
    "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
  signup_disabled: "A criação de contas está desativada no momento.",
  session_not_found: "Sua sessão expirou. Faça login novamente.",
  refresh_token_not_found: "Sua sessão expirou. Faça login novamente.",
  user_not_found: "Usuário não encontrado.",
};

const MESSAGES_BY_TEXT: { includes: string; message: string }[] = [
  {
    includes: "no rows",
    message: "Não encontramos o registro solicitado.",
  },
  {
    includes: "single json object",
    message: "Não encontramos o registro solicitado.",
  },
  {
    includes: "jwt",
    message: "Sua sessão expirou. Entre novamente para continuar.",
  },
  {
    includes: "expired",
    message: "Sua sessão expirou. Entre novamente para continuar.",
  },
  {
    includes: "unauthorized",
    message: "Você não tem permissão para realizar esta operação.",
  },
  {
    includes: "permission denied",
    message: "Você não tem permissão para realizar esta operação.",
  },
  {
    includes: "row-level security",
    message: "Você não tem permissão para acessar estes dados.",
  },
  {
    includes: "duplicate key",
    message: "Já existe um registro com esses dados.",
  },
  {
    includes: "already exists",
    message: "Já existe um registro com esses dados.",
  },
  {
    includes: "foreign key",
    message: "Não foi possível excluir ou alterar: há registros vinculados.",
  },
  {
    includes: "not null",
    message: "Preencha todos os campos obrigatórios.",
  },
  {
    includes: "invalid input syntax",
    message: "Revise os dados informados e tente novamente.",
  },
  {
    includes: "network request failed",
    message: "Sem conexão com a internet. Tente novamente.",
  },
  {
    includes: "failed to fetch",
    message: "Sem conexão com a internet. Tente novamente.",
  },
  {
    includes: "network",
    message: "Sem conexão com a internet. Tente novamente.",
  },
  {
    includes: "timeout",
    message: "O servidor demorou para responder. Tente novamente.",
  },
  {
    includes: "aborted",
    message: "A operação foi cancelada. Tente novamente.",
  },
  {
    includes: "too many requests",
    message: "Muitas tentativas. Aguarde um instante e tente novamente.",
  },
  {
    includes: "rate limit",
    message: "Muitas tentativas. Aguarde um instante e tente novamente.",
  },
  {
    includes: "invalid login credentials",
    message: "E-mail ou senha inválidos.",
  },
  {
    includes: "email not confirmed",
    message: "Confirme seu e-mail antes de continuar.",
  },
  {
    includes: "already registered",
    message: "Este e-mail já está cadastrado. Faça login.",
  },
  {
    includes: "password should be at least",
    message: "A senha é muito fraca. Use pelo menos 6 caracteres.",
  },
  {
    includes: "for security purposes",
    message: "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
  },
  {
    includes: "unable to validate email",
    message: "Informe um e-mail válido.",
  },
];

function normalizedMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const value = (error as { message?: unknown }).message;
    if (typeof value === "string") {
      return value.toLowerCase();
    }
  }

  if (typeof error === "string") {
    return error.toLowerCase();
  }

  return "";
}

export function resolveErrorMessage(error: unknown): string {
  const code =
    error && typeof error === "object" && "code" in error
      ? (error as { code?: unknown }).code
      : null;

  if (typeof code === "string" && MESSAGES_BY_CODE[code]) {
    return MESSAGES_BY_CODE[code];
  }

  const normalized = normalizedMessage(error);

  const codeMatch = Object.keys(MESSAGES_BY_CODE).find((key) =>
    normalized.includes(key.toLowerCase()),
  );

  if (codeMatch) {
    return MESSAGES_BY_CODE[codeMatch];
  }

  const textMatch = MESSAGES_BY_TEXT.find(({ includes }) =>
    normalized.includes(includes),
  );

  if (textMatch) {
    return textMatch.message;
  }

  Sentry.captureException(error, {
    tags: { origem: "resolveErrorMessage" },
  });

  return FALLBACK_MESSAGE;
}

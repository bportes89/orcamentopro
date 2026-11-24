import type { AuthError } from "@supabase/supabase-js";

const FALLBACK_MESSAGE =
  "Não foi possível concluir a operação. Tente novamente.";

const MESSAGES_BY_CODE: Record<string, string> = {
  invalid_credentials: "E-mail ou senha inválidos.",
  email_not_confirmed: "Confirme seu e-mail antes de entrar.",
  email_address_invalid: "Informe um e-mail válido.",
  user_already_exists: "Este e-mail já está cadastrado. Faça login.",
  weak_password: "A senha é muito fraca. Use pelo menos 6 caracteres.",
  same_password: "A nova senha deve ser diferente da senha atual.",
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
    includes: "invalid login credentials",
    message: "E-mail ou senha inválidos.",
  },
  {
    includes: "email not confirmed",
    message: "Confirme seu e-mail antes de entrar.",
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
    message:
      "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
  },
  {
    includes: "unable to validate email",
    message: "Informe um e-mail válido.",
  },
];

export function translateAuthError(error: AuthError): string {
  if (error.code && MESSAGES_BY_CODE[error.code]) {
    return MESSAGES_BY_CODE[error.code];
  }

  const normalized = error.message.toLowerCase();
  const matched = MESSAGES_BY_TEXT.find(({ includes }) =>
    normalized.includes(includes),
  );

  return matched?.message ?? FALLBACK_MESSAGE;
}

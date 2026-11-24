import * as Sentry from "@sentry/react-native";

let inicializado = false;

export function configureSentry(): void {
  if (inicializado) {
    return;
  }

  inicializado = true;

  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

  if (!dsn) {
    return;
  }

  Sentry.init({
    dsn,
    sendDefaultPii: true,
    tracesSampleRate: __DEV__ ? 1 : 0.2,
  });
}

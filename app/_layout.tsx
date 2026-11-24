import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as Sentry from "@sentry/react-native";

import { ThemeProvider } from "@/components/ThemeProvider";
import { AnalyticsProvider } from "@/components/analytics-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { startSyncManager } from "@/db/sync/sync-manager";
import { useAuth } from "@/hooks/use-auth";
import { useDatabaseMigrations } from "@/hooks/use-database-migrations";
import { useProfile } from "@/hooks/use-profile";
import { resolveErrorMessage } from "@/lib/resolve-error-message";
import { configureSentry } from "@/lib/observability";
import { listarOrcamentos } from "@/services/orcamentos";
import { configurarCompras } from "@/services/purchases";

import "@/global.css";

configureSentry();

function RootLayout() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            networkMode: "always",
            retry: false,
            staleTime: 30_000,
          },
          mutations: {
            networkMode: "always",
          },
        },
      }),
  );
  const [tentativaBanco, setTentativaBanco] = useState(0);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AnalyticsProvider>
            <DatabaseGate
              key={tentativaBanco}
              onRetry={() => setTentativaBanco((valor) => valor + 1)}
            />
          </AnalyticsProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

function DatabaseGate({ onRetry }: { onRetry: () => void }) {
  const { success, error } = useDatabaseMigrations();

  if (error) {
    return (
      <ErrorState
        title="Não foi possível preparar o app"
        message={resolveErrorMessage(error)}
        actionLabel="Tentar novamente"
        onAction={onRetry}
        retryAccessibilityLabel="Tentar preparar o banco de dados novamente"
      />
    );
  }

  if (!success) {
    return <LoadingScreen label="Preparando seus dados..." />;
  }

  return <AuthGate />;
}

function AuthGate() {
  const { session, loading } = useAuth();
  const { profile } = useProfile();
  const userId = session?.user.id ?? null;

  useEffect(() => {
    if (!userId) {
      return;
    }

    void configurarCompras(userId);

    return startSyncManager();
  }, [userId]);

  if (loading || (userId && !profile)) {
    return <LoadingScreen label="Carregando sua conta..." />;
  }

  const temOrcamentos = userId ? listarOrcamentos(userId).length > 0 : false;
  const precisaOnboarding =
    !!userId && !profile?.onboardingDone && !temOrcamentos;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!session} redirectTo="/">
        <Stack.Screen name="(auth)" />
      </Stack.Protected>

      <Stack.Protected
        guard={!!session && precisaOnboarding}
        redirectTo="/orcamentos"
      >
        <Stack.Screen name="onboarding" />
      </Stack.Protected>

      <Stack.Protected guard={!!session && !precisaOnboarding} redirectTo="/login">
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="orcamento" />
        <Stack.Screen name="paywall" />
      </Stack.Protected>
    </Stack>
  );
}

export default Sentry.wrap(RootLayout);

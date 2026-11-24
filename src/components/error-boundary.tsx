import { Component, type ErrorInfo, type ReactNode } from "react";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Sentry from "@sentry/react-native";

import { ErrorState } from "@/components/ui/error-state";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: info.componentStack ?? undefined,
        },
      },
    });
  }

  private recuperar = () => {
    this.setState({ error: null });

    try {
      router.replace("/");
    } catch {
      router.back();
    }
  };

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
        <ErrorState
          title="Ocorreu um problema"
          message="O app encontrou um erro inesperado. Seus dados salvos no aparelho permanecem seguros. Tente voltar ao início."
          actionLabel="Tentar novamente"
          onAction={this.recuperar}
          retryAccessibilityLabel="Tentar novamente e voltar ao início"
        />
      </SafeAreaView>
    );
  }
}

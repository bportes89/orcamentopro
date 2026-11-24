import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { drain } from "@/db/sync/sync-manager";
import { useSyncStatus } from "@/services/sync-status";
import { ErrorState } from "@/components/ui/error-state";
import { SyncBadge } from "@/components/ui/sync-badge";

export function Screen({ children }: { children: ReactNode }) {
  const status = useSyncStatus();

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <SafeAreaView style={{ flex: 1 }}>
        <View className="items-end px-4 pt-1">
          <SyncBadge />
        </View>
        {status === "error" ? (
          <ErrorState
            compact
            title="Alterações pendentes"
            message="Algumas mudanças ainda não foram enviadas. Verifique sua conexão e tente novamente."
            actionLabel="Tentar novamente"
            retryAccessibilityLabel="Tentar sincronizar novamente"
            onAction={() => {
              void drain();
            }}
          />
        ) : null}
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {children}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

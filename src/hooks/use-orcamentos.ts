import { useCallback, useState } from "react";
import NetInfo from "@react-native-community/netinfo";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useFocusEffect } from "expo-router";

import { useAuth } from "@/hooks/use-auth";
import { resolveErrorMessage } from "@/lib/resolve-error-message";
import {
  listarOrcamentos,
  sincronizarOrcamentos,
} from "@/services/orcamentos";

export function useOrcamentos() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["orcamentos", userId],
    queryFn: () => (userId ? listarOrcamentos(userId) : []),
    enabled: Boolean(userId),
  });

  useFocusEffect(
    useCallback(() => {
      if (userId) {
        void queryClient.invalidateQueries({
          queryKey: ["orcamentos", userId],
        });
      }
    }, [queryClient, userId]),
  );

  const refresh = useCallback(async () => {
    if (!userId) {
      return;
    }

    try {
      const network = await NetInfo.fetch();

      if (network.isConnected !== true) {
        setSyncError("Sem conexão com a internet. Tente novamente.");
        return;
      }

      setIsRefreshing(true);
      setSyncError(null);
      await sincronizarOrcamentos(userId);
      await queryClient.invalidateQueries({
        queryKey: ["orcamentos", userId],
      });
    } catch (error) {
      setSyncError(resolveErrorMessage(error));
    } finally {
      setIsRefreshing(false);
    }
  }, [userId, queryClient]);

  return {
    orcamentos: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    retry: () => query.refetch(),
    isRefreshing,
    syncError,
    refresh,
  };
}

import { useCallback, useEffect, useState } from "react";
import NetInfo from "@react-native-community/netinfo";
import { useQuery } from "@tanstack/react-query";
import { useFocusEffect } from "expo-router";
import type {
  PurchasesOfferings,
  PurchasesPackage,
} from "react-native-purchases";

import { useAuth } from "@/hooks/use-auth";
import {
  getOfferings,
  mensagemErroCompra,
  obterPacoteMensal,
  purchase,
  registrarOuvinteAssinatura,
  restore,
  sincronizarEstadoRevenueCat,
  tipoErroCompra,
} from "@/services/purchases";
import {
  LIMITE_GRATUITO,
  obterEstadoAssinatura,
  sincronizarAssinatura,
  useAssinaturaCache,
  type EstadoAssinatura,
} from "@/services/subscription";

export type EstadoCompra = "idle" | "pendente" | "cancelado" | "erro" | "sucesso";

const ESTADO_INICIAL: EstadoAssinatura = {
  isPro: false,
  orcamentosRestantes: LIMITE_GRATUITO,
  totalNoMes: 0,
  plano: "free",
  status: "inactive",
  expiresAt: null,
};

function rotuloStatus(status: EstadoAssinatura["status"]): string {
  switch (status) {
    case "active":
      return "Pro";
    case "trialing":
      return "Pro em teste";
    case "grace_period":
      return "Pro em tolerância";
    case "billing_issue":
      return "Problema de cobrança";
    case "canceled":
      return "Cancelada, válida até o fim do período";
    case "expired":
      return "Assinatura expirada";
    default:
      return "Gratuito";
  }
}

export function useSubscription() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const versao = useAssinaturaCache((state) => state.versao);
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [estadoCompra, setEstadoCompra] = useState<EstadoCompra>("idle");
  const [erroCompra, setErroCompra] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      return;
    }

    void sincronizarEstadoRevenueCat(userId);
    void getOfferings().then((resultado) => setOfferings(resultado));

    const removerOuvinte = registrarOuvinteAssinatura(userId, () => {
      void sincronizarAssinatura(userId).catch(() => undefined);
    });

    return removerOuvinte;
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    let ativo = true;

    void (async () => {
      const rede = await NetInfo.fetch();

      if (!ativo || rede.isConnected !== true) {
        return;
      }

      try {
        await sincronizarAssinatura(userId);
      } catch {
        return;
      }
    })();

    return () => {
      ativo = false;
    };
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      if (!userId) {
        return;
      }

      void sincronizarAssinatura(userId).catch(() => undefined);
    }, [userId]),
  );

  const query = useQuery({
    queryKey: ["subscription", userId, versao],
    queryFn: () => (userId ? obterEstadoAssinatura(userId) : ESTADO_INICIAL),
    enabled: Boolean(userId),
    staleTime: 0,
  });

  const comprar = useCallback(
    async (pacote: PurchasesPackage): Promise<boolean> => {
      if (!userId || purchasing) {
        return false;
      }

      setPurchasing(true);
      setEstadoCompra("pendente");
      setErroCompra(null);

      try {
        await purchase(userId, pacote);
        setEstadoCompra("sucesso");
        void sincronizarAssinatura(userId).catch(() => undefined);
        return true;
      } catch (error) {
        const tipo = tipoErroCompra(error);
        setEstadoCompra(tipo === "cancelado" ? "cancelado" : "erro");
        setErroCompra(mensagemErroCompra(error));
        return false;
      } finally {
        setPurchasing(false);
      }
    },
    [userId, purchasing],
  );

  const restaurar = useCallback(async (): Promise<boolean> => {
    if (!userId || restoring) {
      return false;
    }

    setRestoring(true);
    setEstadoCompra("pendente");
    setErroCompra(null);

    try {
      await restore(userId);
      setEstadoCompra("sucesso");
      void sincronizarAssinatura(userId).catch(() => undefined);
      return true;
    } catch (error) {
      setEstadoCompra("erro");
      setErroCompra(mensagemErroCompra(error));
      return false;
    } finally {
      setRestoring(false);
    }
  }, [userId, restoring]);

  const estado = query.data ?? ESTADO_INICIAL;

  return {
    isPro: estado.isPro,
    orcamentosRestantes: estado.orcamentosRestantes,
    totalNoMes: estado.totalNoMes,
    plano: estado.plano,
    status: estado.status,
    expiresAt: estado.expiresAt,
    loading: query.isLoading,
    offerings,
    pacoteMensal: obterPacoteMensal(offerings),
    purchasing,
    restoring,
    estadoCompra,
    erroCompra,
    billingIssue: estado.status === "billing_issue",
    gracePeriod: estado.status === "grace_period",
    statusLabel: rotuloStatus(estado.status),
    comprar,
    restaurar,
  };
}

import { useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { StatusBadge } from "@/components/orcamento/status-badge";
import { PlanBadge } from "@/components/subscription/plan-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Screen } from "@/components/ui/screen";
import { useOrcamentos } from "@/hooks/use-orcamentos";
import { useSubscription } from "@/hooks/use-subscription";
import { formatBRL } from "@/lib/currency";
import { formatDateBR } from "@/lib/date";
import { resolveErrorMessage } from "@/lib/resolve-error-message";
import type { LocalOrcamento } from "@/services/orcamentos";
import type { StatusOrcamento } from "@/types";

type StatusFiltro = "todos" | StatusOrcamento;

const FILTROS: { valor: StatusFiltro; label: string }[] = [
  { valor: "todos", label: "Todos" },
  { valor: "rascunho", label: "Rascunho" },
  { valor: "enviado", label: "Enviado" },
  { valor: "aprovado", label: "Aprovado" },
  { valor: "recusado", label: "Recusado" },
];

function ehDoMesAtual(iso: string): boolean {
  const data = new Date(iso);
  const agora = new Date();

  return (
    data.getMonth() === agora.getMonth() &&
    data.getFullYear() === agora.getFullYear()
  );
}

function OrcamentoCard({ orcamento }: { orcamento: LocalOrcamento }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir orçamento de ${orcamento.clienteNome}`}
      accessibilityHint="Mostra os detalhes do orçamento"
      onPress={() =>
        router.push({
          pathname: "/orcamento/[id]",
          params: { id: orcamento.id },
        })
      }
      className="rounded-2xl bg-white p-4 dark:bg-slate-900"
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text
            numberOfLines={1}
            className="text-base font-semibold text-slate-900 dark:text-slate-50"
          >
            {orcamento.clienteNome}
          </Text>
          <Text className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {formatDateBR(new Date(orcamento.createdAt))}
          </Text>
        </View>
        <StatusBadge status={orcamento.status} />
      </View>

      <View className="mt-4 flex-row items-center justify-between">
        <Text className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
          Total
        </Text>
        <Text className="text-lg font-bold text-slate-900 dark:text-slate-50">
          {formatBRL(orcamento.total)}
        </Text>
      </View>
    </Pressable>
  );
}

export default function OrcamentosScreen() {
  const {
    orcamentos,
    isLoading,
    isError,
    error,
    retry,
    isRefreshing,
    refresh,
    syncError,
  } = useOrcamentos();
  const { isPro, orcamentosRestantes } = useSubscription();
  const [filtro, setFiltro] = useState<StatusFiltro>("todos");

  const aprovadosNoMes = useMemo(
    () =>
      orcamentos.filter(
        (orcamento) =>
          orcamento.status === "aprovado" &&
          ehDoMesAtual(orcamento.createdAt),
      ),
    [orcamentos],
  );

  const totalAprovadoNoMes = useMemo(
    () =>
      aprovadosNoMes.reduce(
        (total, orcamento) => total + orcamento.total,
        0,
      ),
    [aprovadosNoMes],
  );

  const orcamentosFiltrados = useMemo(
    () =>
      filtro === "todos"
        ? orcamentos
        : orcamentos.filter((orcamento) => orcamento.status === filtro),
    [orcamentos, filtro],
  );

  const abrirNovoOrcamento = () => {
    if (!isPro && orcamentosRestantes <= 0) {
      router.push("/paywall");
      return;
    }

    router.push("/orcamento/novo");
  };

  return (
    <Screen>
      <View className="flex-1">
        <View className="px-6 pt-6">
          <Text className="text-3xl font-bold text-slate-900 dark:text-slate-50">
            Orçamentos
          </Text>
          <Text className="mt-2 text-base text-slate-500 dark:text-slate-400">
            Acompanhe e gerencie seus orçamentos.
          </Text>
          <View className="mt-3">
            <PlanBadge />
          </View>

          <View className="mt-4 rounded-2xl bg-emerald-50 p-4 dark:bg-emerald-950">
            <Text className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
              Fechados no mês
            </Text>
            <Text className="mt-1 text-base font-semibold text-emerald-800 dark:text-emerald-200">
              {aprovadosNoMes.length}{" "}
              {aprovadosNoMes.length === 1 ? "aprovado" : "aprovados"} •{" "}
              {formatBRL(totalAprovadoNoMes)} em negócios fechados no mês
            </Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          className="mt-4"
          contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}
        >
          {FILTROS.map((item) => {
            const ativo = filtro === item.valor;

            return (
              <Pressable
                key={item.valor}
                accessibilityRole="button"
                accessibilityState={{ selected: ativo }}
                onPress={() => setFiltro(item.valor)}
                className={`min-h-[48px] justify-center rounded-full border px-4 ${
                  ativo
                    ? "border-blue-600 bg-blue-600"
                    : "border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900"
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    ativo
                      ? "text-white"
                      : "text-slate-700 dark:text-slate-200"
                  }`}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {isLoading ? (
          <LoadingScreen label="Carregando seus orçamentos..." />
        ) : isError && orcamentos.length === 0 ? (
          <ErrorState
            title="Não foi possível carregar os orçamentos"
            message={resolveErrorMessage(error)}
            actionLabel="Tentar novamente"
            onAction={retry}
            retryAccessibilityLabel="Tentar carregar os orçamentos novamente"
          />
        ) : (
          <>
            {syncError ? (
              <ErrorState
                compact
                title="Não foi possível atualizar"
                message={syncError}
                actionLabel="Tentar novamente"
                onAction={() => {
                  void refresh();
                }}
                retryAccessibilityLabel="Tentar atualizar os orçamentos novamente"
              />
            ) : null}
            <FlatList
              className="mt-4 flex-1"
              contentContainerStyle={{
                paddingHorizontal: 24,
                paddingBottom: 120,
              }}
              data={orcamentosFiltrados}
              keyExtractor={(orcamento) => orcamento.id}
              renderItem={({ item }) => <OrcamentoCard orcamento={item} />}
              ItemSeparatorComponent={() => <View className="h-3" />}
              ListEmptyComponent={
                orcamentos.length > 0 ? (
                  <EmptyState
                    compact
                    icon="filter-outline"
                    title="Nenhum orçamento com este status"
                    subtitle="Ajuste o filtro para ver outros orçamentos."
                    actionLabel="Ver todos"
                    onAction={() => setFiltro("todos")}
                  />
                ) : (
                  <EmptyState
                    compact
                    icon="document-text-outline"
                    title="Nenhum orçamento ainda"
                    subtitle="Crie seu primeiro orçamento e comece a fechar negócios."
                    actionLabel="Criar primeiro orçamento"
                    onAction={abrirNovoOrcamento}
                  />
                )
              }
              refreshing={isRefreshing}
              onRefresh={refresh}
              showsVerticalScrollIndicator={false}
            />
          </>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Novo orçamento"
          onPress={abrirNovoOrcamento}
          className="absolute bottom-6 right-6 min-h-[56px] flex-row items-center justify-center gap-2 rounded-full bg-blue-600 px-5 shadow-lg"
        >
          <Ionicons name="add" size={24} color="#ffffff" />
          <Text className="text-base font-semibold text-white">
            Novo orçamento
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}

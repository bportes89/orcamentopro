import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { openURL } from "expo-linking";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import {
  OrcamentoForm,
  type OrcamentoFormSubmission,
} from "@/components/orcamento/orcamento-form";
import { StatusBadge } from "@/components/orcamento/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Screen } from "@/components/ui/screen";
import { useAuth } from "@/hooks/use-auth";
import type { OrcamentoFormInitialValues } from "@/hooks/use-orcamento-form";
import { useProfile } from "@/hooks/use-profile";
import { formatBRL } from "@/lib/currency";
import { formatDateBR } from "@/lib/date";
import { resolveErrorMessage } from "@/lib/resolve-error-message";
import {
  atualizarOrcamento,
  atualizarStatusOrcamento,
  excluirOrcamento,
  marcarOrcamentoEnviado,
  obterOrcamento,
} from "@/services/orcamentos";
import { gerarPdfOrcamento } from "@/services/pdf";
import { ensureLocalProfile } from "@/services/profiles";
import { compartilharPdf } from "@/services/share";
import { drain } from "@/db/sync/sync-manager";
import type { OrcamentoDetalhe } from "@/services/orcamentos";
import type { StatusOrcamento } from "@/types";

function validadeInicial(validade: number): 7 | 15 | 30 {
  return validade === 15 || validade === 30 ? validade : 7;
}

function mensagemWhatsapp(
  detalhe: OrcamentoDetalhe,
  perfil: Awaited<ReturnType<typeof ensureLocalProfile>>,
): string {
  const primeiroItem = detalhe.itens[0]?.descricao ?? "serviços";

  return `Olá ${detalhe.orcamento.clienteNome}, segue o orçamento para ${primeiroItem} e outros serviços. Qualquer dúvida, estou à disposição. — ${perfil.nome}`;
}

async function abrirWhatsapp(telefone: string, mensagem: string): Promise<void> {
  const numero = telefone.replace(/\D/g, "").replace(/^0+/, "");
  const texto = encodeURIComponent(mensagem);

  await openURL(`whatsapp://send?phone=${numero}&text=${texto}`);
}

export default function OrcamentoDetalheScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editando, setEditando] = useState(false);
  const [gerandoPdf, setGerandoPdf] = useState(false);
  const { profile } = useProfile();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["orcamento", id],
    queryFn: () => (user ? obterOrcamento(user.id, id) : null),
    enabled: Boolean(user && id),
  });

  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: ["orcamento", id] });
    queryClient.invalidateQueries({ queryKey: ["orcamentos"] });
  };

  const gerarPdf = async () => {
    const userId = user?.id;
    const detalhe = data;

    if (!userId || !detalhe || gerandoPdf) {
      return;
    }

    setGerandoPdf(true);

    try {
      const orcamentoProfile = profile ?? (user ? ensureLocalProfile(user) : null);

      if (!orcamentoProfile) {
        throw new Error("Complete o perfil antes de gerar o PDF.");
      }

      const caminho = await gerarPdfOrcamento(
        detalhe.orcamento,
        detalhe.itens,
        orcamentoProfile,
      );

      if (detalhe.orcamento.status === "rascunho") {
        marcarOrcamentoEnviado(userId, detalhe.orcamento.id);
        void drain();
      }

      invalidar();

      try {
        await compartilharPdf(caminho, mensagemWhatsapp(detalhe, orcamentoProfile));
      } catch {
        Alert.alert(
          "Não foi possível compartilhar o PDF",
          "Abra aplicativos de compartilhamento manualmente.",
        );
      }
    } catch (error) {
      Alert.alert(
        "Não foi possível gerar o PDF",
        resolveErrorMessage(error),
      );
    } finally {
      setGerandoPdf(false);
    }
  };

  const abrirWhatsappCliente = async () => {
    const userId = user?.id;
    const detalhe = data;
    const orcamentoProfile = profile ?? (user ? ensureLocalProfile(user) : null);
    const telefone = detalhe?.orcamento.clienteTelefone?.trim();

    if (!userId || !detalhe || !orcamentoProfile || !telefone) {
      Alert.alert(
        "Telefone do cliente não informado",
        "Cadastre o telefone do cliente para usar o WhatsApp.",
      );
      return;
    }

    try {
      await abrirWhatsapp(telefone, mensagemWhatsapp(detalhe, orcamentoProfile));
    } catch {
      Alert.alert(
        "WhatsApp não encontrado",
        "Abra o WhatsApp manualmente e envie o orçamento.",
      );
    }
  };

  const confirmarStatus = (status: StatusOrcamento) => {
    const userId = user?.id;

    if (!userId || !data) {
      return;
    }

    const aprovando = status === "aprovado";

    Alert.alert(
      aprovando ? "Aprovar orçamento" : "Recusar orçamento",
      `Deseja marcar o orçamento de ${data.orcamento.clienteNome} como ${
        aprovando ? "aprovado" : "recusado"
      }?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: aprovando ? "Aprovar" : "Recusar",
          style: aprovando ? "default" : "destructive",
          onPress: () => {
            try {
              atualizarStatusOrcamento(
                userId,
                data.orcamento.id,
                status,
              );
              invalidar();
            } catch {
              Alert.alert(
                "Não foi possível atualizar",
                "Tente novamente em instantes.",
              );
            }
          },
        },
      ],
    );
  };

  const confirmarExclusao = () => {
    const userId = user?.id;

    if (!userId || !data) {
      return;
    }

    Alert.alert(
      "Excluir orçamento",
      "Deseja excluir este orçamento? Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => {
            try {
              excluirOrcamento(userId, data.orcamento.id);
              queryClient.removeQueries({ queryKey: ["orcamento", id] });
              queryClient.invalidateQueries({ queryKey: ["orcamentos"] });
              router.replace("/orcamentos");
            } catch {
              Alert.alert(
                "Não foi possível excluir",
                "Tente novamente em instantes.",
              );
            }
          },
        },
      ],
    );
  };

  const handleSalvarEdicao = (dados: OrcamentoFormSubmission) => {
    const userId = user?.id;

    if (!userId || !data) {
      return;
    }

    const salvar = (status: StatusOrcamento) => {
      try {
        const atualizado = atualizarOrcamento(
          userId,
          data.orcamento.id,
          {
            ...dados,
            status,
          },
        );

        if (!atualizado) {
          Alert.alert(
            "Orçamento não encontrado",
            "Ele pode ter sido excluído.",
          );
          setEditando(false);
          invalidar();
          return;
        }

        setEditando(false);
        invalidar();
      } catch {
        Alert.alert(
          "Não foi possível salvar",
          "Revise os dados e tente novamente.",
        );
      }
    };

    if (data.orcamento.status === "enviado") {
      Alert.alert(
        "Status do orçamento",
        "Deseja manter o status de enviado ou voltar para rascunho?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Voltar para rascunho",
            onPress: () => salvar("rascunho"),
          },
          {
            text: "Manter enviado",
            onPress: () => salvar("enviado"),
          },
        ],
      );
      return;
    }

    salvar(data.orcamento.status);
  };

  const edicaoInicial: OrcamentoFormInitialValues | undefined = data
    ? {
        clienteNome: data.orcamento.clienteNome,
        clienteTelefone: data.orcamento.clienteTelefone ?? "",
        validadeDias: validadeInicial(data.orcamento.validadeDias),
        observacoes: data.orcamento.observacoes ?? "",
          itens: data.itens.map((item) => ({
            id: item.id,
            descricao: item.descricao,
            unidade: item.unidade ?? null,
            quantidade: item.quantidade,
            precoUnitario: item.precoUnitario,
          })),
      }
    : undefined;

  return (
    <Screen>
      <View className="flex-1">
        <View className="flex-row items-center gap-3 px-6 py-4">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            onPress={() => router.back()}
            className="h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800"
          >
            <Ionicons name="arrow-back" size={22} color="#475569" />
          </Pressable>
          <Text
            numberOfLines={1}
            className="flex-1 text-xl font-bold text-slate-900 dark:text-slate-50"
          >
            {data?.orcamento.clienteNome ?? "Orçamento"}
          </Text>
        </View>

        {isLoading ? (
          <LoadingScreen label="Carregando o orçamento..." />
        ) : isError ? (
          <ErrorState
            title="Não foi possível carregar o orçamento"
            message={resolveErrorMessage(error)}
            actionLabel="Tentar novamente"
            onAction={() => {
              void refetch();
            }}
            retryAccessibilityLabel="Tentar carregar o orçamento novamente"
          />
        ) : !data ? (
          <EmptyState
            icon="document-outline"
            title="Orçamento não encontrado"
            subtitle="Ele pode ter sido excluído ou o link não é mais válido."
            actionLabel="Voltar"
            onAction={() => router.back()}
            actionAccessibilityLabel="Voltar para a lista de orçamentos"
          />
        ) : (
          <ScrollView
            className="flex-1"
            contentContainerClassName="px-6 pb-10"
            showsVerticalScrollIndicator={false}
          >
            <View className="rounded-2xl bg-white p-5 dark:bg-slate-900">
              <View className="flex-row items-center justify-between">
                <StatusBadge status={data.orcamento.status} />
                <Text className="text-sm text-slate-500 dark:text-slate-400">
                  {formatDateBR(new Date(data.orcamento.createdAt))}
                </Text>
              </View>

              <Text className="mt-3 text-2xl font-bold text-slate-900 dark:text-slate-50">
                {data.orcamento.clienteNome}
              </Text>
              {data.orcamento.clienteTelefone ? (
                <Text className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {data.orcamento.clienteTelefone}
                </Text>
              ) : null}
              {data.orcamento.clienteEmail ? (
                <Text className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {data.orcamento.clienteEmail}
                </Text>
              ) : null}
              {data.orcamento.respondidoEm ? (
                <Text className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                  Respondido em{" "}
                  {formatDateBR(new Date(data.orcamento.respondidoEm))}
                </Text>
              ) : null}
              {data.orcamento.enviadoEm ? (
                <Text className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                  Enviado em{" "}
                  {formatDateBR(new Date(data.orcamento.enviadoEm))}
                </Text>
              ) : null}

              <View className="mt-4 flex-row gap-3">
                <View className="flex-1 rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                  <Text className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                    Validade
                  </Text>
                  <Text className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-50">
                    {data.orcamento.validadeDias} dias
                  </Text>
                </View>
                <View className="flex-1 rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                  <Text className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                    Total
                  </Text>
                  <Text className="mt-1 text-base font-semibold text-blue-600">
                    {formatBRL(data.orcamento.total)}
                  </Text>
                </View>
              </View>
            </View>

            <View className="mt-4 flex-row gap-3">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Editar orçamento"
                onPress={() => setEditando(true)}
                className="min-h-[48px] flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900"
              >
                <Ionicons name="pencil-outline" size={18} color="#475569" />
                <Text className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Editar
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Gerar PDF do orçamento"
                accessibilityState={{ disabled: gerandoPdf }}
                onPress={gerarPdf}
                disabled={gerandoPdf}
                className="min-h-[48px] flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900"
              >
                {gerandoPdf ? (
                  <ActivityIndicator size="small" color="#475569" />
                ) : (
                  <Ionicons
                    name="document-text-outline"
                    size={18}
                    color="#475569"
                  />
                )}
                <Text className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {gerandoPdf ? "Gerando PDF..." : "Gerar PDF"}
                </Text>
              </Pressable>
            </View>

            {data.orcamento.clienteTelefone ? (
              <View className="mt-3">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Abrir WhatsApp com o orçamento"
                  onPress={abrirWhatsappCliente}
                  className="min-h-[48px] w-full flex-row items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900"
                >
                  <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
                  <Text className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Enviar por WhatsApp
                  </Text>
                </Pressable>
              </View>
            ) : null}

            <View className="mt-3 flex-row gap-3">
              {data.orcamento.status !== "aprovado" ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Aprovar orçamento"
                  onPress={() => confirmarStatus("aprovado")}
                  className="min-h-[48px] flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3"
                >
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={18}
                    color="#ffffff"
                  />
                  <Text className="text-sm font-semibold text-white">
                    Aprovar
                  </Text>
                </Pressable>
              ) : null}
              {data.orcamento.status !== "recusado" ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Recusar orçamento"
                  onPress={() => confirmarStatus("recusado")}
                  className="min-h-[48px] flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 dark:border-red-900 dark:bg-red-950"
                >
                  <Ionicons
                    name="close-circle-outline"
                    size={18}
                    color="#dc2626"
                  />
                  <Text className="text-sm font-semibold text-red-700 dark:text-red-300">
                    Recusar
                  </Text>
                </Pressable>
              ) : null}
            </View>

            {data.orcamento.observacoes ? (
              <View className="mt-4 rounded-2xl bg-white p-5 dark:bg-slate-900">
                <Text className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                  Observações
                </Text>
                <Text className="mt-2 text-base text-slate-700 dark:text-slate-200">
                  {data.orcamento.observacoes}
                </Text>
              </View>
            ) : null}

            <Text className="mb-3 mt-6 text-base font-semibold text-slate-900 dark:text-slate-50">
              Itens
            </Text>

            <View className="gap-3">
              {data.itens.map((item) => (
                <View
                  key={item.id}
                  className="rounded-2xl bg-white p-4 dark:bg-slate-900"
                >
                  <Text className="text-base font-semibold text-slate-900 dark:text-slate-50">
                    {item.descricao}
                  </Text>
                  <View className="mt-2 flex-row items-center justify-between">
                    <Text className="text-sm text-slate-500 dark:text-slate-400">
                      {item.quantidade}
                      {item.unidade ? ` ${item.unidade}` : ""}{" "}
                      × {formatBRL(item.precoUnitario)}
                    </Text>
                    <Text className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {formatBRL(
                        item.subtotal ??
                          item.quantidade * item.precoUnitario,
                      )}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            <View className="mt-4 flex-row items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <Text className="text-base font-semibold text-slate-700 dark:text-slate-200">
                Total
              </Text>
              <Text className="text-xl font-bold text-slate-900 dark:text-slate-50">
                {formatBRL(data.orcamento.total)}
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Excluir orçamento"
              onPress={confirmarExclusao}
              className="mt-6 min-h-[48px] flex-row items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950"
            >
              <Ionicons name="trash-outline" size={18} color="#dc2626" />
              <Text className="text-sm font-semibold text-red-700 dark:text-red-300">
                Excluir orçamento
              </Text>
            </Pressable>
          </ScrollView>
        )}
      </View>

      {editando && edicaoInicial ? (
        <Modal
          visible
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => setEditando(false)}
        >
          <OrcamentoForm
            title="Editar orçamento"
            salvarLabel="Salvar alterações"
            initialValues={edicaoInicial}
            onVoltar={() => setEditando(false)}
            onSalvar={handleSalvarEdicao}
          />
        </Modal>
      ) : null}
    </Screen>
  );
}

import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { CatalogoPickerModal } from "@/components/orcamento/catalogo-picker-modal";
import { Screen } from "@/components/ui/screen";
import { TextField } from "@/components/ui/text-field";
import { Tooltip } from "@/components/ui/tooltip";
import {
  useOrcamentoForm,
  type OrcamentoFormInitialValues,
  type OrcamentoFormItem,
  type OrcamentoFormItemChanges,
} from "@/hooks/use-orcamento-form";
import { formatBRL, parseBRLInput } from "@/lib/currency";
import { formatPhoneBR } from "@/lib/masks";
import { VALIDADES_ORCAMENTO, novoOrcamentoSchema } from "@/lib/validators";

export type OrcamentoFormSubmission = {
  clienteNome: string;
  clienteTelefone: string | null;
  validadeDias: (typeof VALIDADES_ORCAMENTO)[number];
  observacoes: string | null;
  itens: {
    id: string;
    descricao: string;
    unidade: string | null;
    quantidade: number;
    precoUnitario: number;
  }[];
};

type OrcamentoFormProps = {
  title: string;
  salvarLabel?: string;
  initialValues?: OrcamentoFormInitialValues;
  mostrarDicaSalvar?: boolean;
  onVoltar: () => void;
  onSalvar: (dados: OrcamentoFormSubmission) => void;
};

function formatQuantidade(valor: number): string {
  return Number.isInteger(valor)
    ? String(valor)
    : valor.toFixed(2).replace(".", ",");
}

type OrcamentoItemRowProps = {
  item: OrcamentoFormItem;
  onUpdate: (id: string, changes: OrcamentoFormItemChanges) => void;
  onRemove: (id: string) => void;
};

function OrcamentoItemRow({
  item,
  onUpdate,
  onRemove,
}: OrcamentoItemRowProps) {
  const diminuir = () =>
    onUpdate(item.id, { quantidade: Math.max(1, item.quantidade - 1) });
  const aumentar = () => onUpdate(item.id, { quantidade: item.quantidade + 1 });

  return (
    <View className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <View className="flex-row items-start gap-2">
        <View className="flex-1">
          <TextInput
            value={item.descricao}
            onChangeText={(texto) =>
              onUpdate(item.id, { descricao: texto })
            }
            placeholder="Descrição do item"
            placeholderTextColor="#94a3b8"
            className="text-base font-semibold text-slate-900 dark:text-slate-50"
          />
          {item.unidade ? (
            <Text className="mt-1 text-xs font-semibold text-slate-400 dark:text-slate-500">
              {item.unidade}
            </Text>
          ) : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Remover ${item.descricao || "item"}`}
          onPress={() => onRemove(item.id)}
          className="h-12 w-12 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800"
        >
          <Ionicons name="trash-outline" size={18} color="#dc2626" />
        </Pressable>
      </View>

      <View className="mt-3 flex-row items-center gap-3">
        <View className="flex-row items-center rounded-xl border border-slate-300 dark:border-slate-700">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Diminuir quantidade"
            disabled={item.quantidade <= 1}
            onPress={diminuir}
            className={`h-12 w-12 items-center justify-center ${
              item.quantidade <= 1 ? "opacity-40" : ""
            }`}
          >
            <Ionicons name="remove" size={18} color="#475569" />
          </Pressable>
          <Text className="min-w-[28px] text-center text-base font-semibold text-slate-900 dark:text-slate-50">
            {formatQuantidade(item.quantidade)}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Aumentar quantidade"
            onPress={aumentar}
            className="h-12 w-12 items-center justify-center"
          >
            <Ionicons name="add" size={18} color="#475569" />
          </Pressable>
        </View>

        <TextInput
          value={formatBRL(item.precoUnitario)}
          onChangeText={(texto) =>
            onUpdate(item.id, { precoUnitario: parseBRLInput(texto) })
          }
          selectTextOnFocus
          keyboardType="numeric"
          placeholder="R$ 0,00"
          placeholderTextColor="#94a3b8"
          className="min-h-[48px] flex-1 rounded-xl border border-slate-300 bg-white px-3 text-right text-base text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
      </View>

      <View className="mt-2 flex-row items-center justify-between">
        <Text className="text-xs text-slate-500 dark:text-slate-400">
          Subtotal
        </Text>
        <Text className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          {formatBRL(item.quantidade * item.precoUnitario)}
        </Text>
      </View>
    </View>
  );
}

export function OrcamentoForm({
  title,
  salvarLabel = "Salvar orçamento",
  initialValues,
  mostrarDicaSalvar = false,
  onVoltar,
  onSalvar,
}: OrcamentoFormProps) {
  const {
    clienteNome,
    setClienteNome,
    clienteTelefone,
    setClienteTelefone,
    validadeDias,
    setValidadeDias,
    observacoes,
    setObservacoes,
    itens,
    totalFormatado,
    adicionarDoCatalogo,
    adicionarItemAvulso,
    removerItem,
    atualizarItem,
  } = useOrcamentoForm(initialValues);

  const [erro, setErro] = useState<string | null>(null);
  const [catalogoAberto, setCatalogoAberto] = useState(false);

  const handleSalvar = () => {
    setErro(null);

    if (itens.length === 0) {
      setErro("Adicione pelo menos 1 item ao orçamento.");
      return;
    }

    const parsed = novoOrcamentoSchema.safeParse({
      cliente_nome: clienteNome,
      cliente_telefone: clienteTelefone,
      validade_dias: validadeDias,
      observacoes,
      itens: itens.map((item) => ({
        descricao: item.descricao,
        quantidade: item.quantidade,
        preco_unitario: item.precoUnitario,
      })),
    });

    if (!parsed.success) {
      setErro(
        parsed.error.issues[0]?.message ?? "Revise os dados do orçamento.",
      );
      return;
    }

    onSalvar({
      clienteNome: parsed.data.cliente_nome,
      clienteTelefone: parsed.data.cliente_telefone || null,
      validadeDias: parsed.data.validade_dias,
      observacoes: parsed.data.observacoes || null,
      itens: parsed.data.itens.map((item, index) => ({
        id: itens[index].id,
        descricao: item.descricao,
        unidade: itens[index].unidade,
        quantidade: item.quantidade,
        precoUnitario: item.preco_unitario,
      })),
    });
  };

  return (
    <Screen>
      <View className="flex-1">
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View className="flex-row items-center gap-3 px-6 py-4">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Voltar"
              onPress={onVoltar}
              className="h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800"
            >
              <Ionicons name="arrow-back" size={22} color="#475569" />
            </Pressable>
            <Text className="flex-1 text-xl font-bold text-slate-900 dark:text-slate-50">
              {title}
            </Text>
          </View>

          <ScrollView
            className="flex-1"
            contentContainerClassName="px-6 pb-6"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="gap-4">
              <TextField
                label="Cliente"
                placeholder="Nome do cliente"
                value={clienteNome}
                onChangeText={setClienteNome}
              />
              <TextField
                label="Telefone (opcional)"
                placeholder="(11) 99999-9999"
                keyboardType="phone-pad"
                value={clienteTelefone}
                onChangeText={(texto) =>
                  setClienteTelefone(formatPhoneBR(texto))
                }
              />
            </View>

            <View className="mt-6">
              <Text className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                Validade
              </Text>
              <View className="flex-row gap-2">
                {VALIDADES_ORCAMENTO.map((dias) => {
                  const ativo = validadeDias === dias;

                  return (
                    <Pressable
                      key={dias}
                      accessibilityRole="button"
                      accessibilityState={{ selected: ativo }}
                      onPress={() => setValidadeDias(dias)}
                      className={`min-h-[48px] flex-1 items-center justify-center rounded-xl border ${
                        ativo
                          ? "border-blue-600 bg-blue-50 dark:bg-blue-950"
                          : "border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900"
                      }`}
                    >
                      <Text
                        className={`text-sm font-semibold ${
                          ativo
                            ? "text-blue-600"
                            : "text-slate-700 dark:text-slate-200"
                        }`}
                      >
                        {dias} dias
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View className="mt-6">
              <Text className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                Observações (opcional)
              </Text>
              <TextInput
                value={observacoes}
                onChangeText={setObservacoes}
                placeholder="Informações adicionais para o cliente"
placeholderTextColor="#64748b"
                multiline
                numberOfLines={3}
                maxLength={500}
                style={{ textAlignVertical: "top" }}
                className="min-h-[96px] rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </View>

            <View className="mt-6">
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-semibold text-slate-900 dark:text-slate-50">
                  Itens
                </Text>
                <Text className="text-sm text-slate-500 dark:text-slate-400">
                  {itens.length} {itens.length === 1 ? "item" : "itens"}
                </Text>
              </View>

              <View className="mt-3 flex-row gap-2">
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setCatalogoAberto(true)}
                  className="min-h-[48px] flex-1 flex-row items-center justify-center gap-1 rounded-xl border border-blue-600 bg-blue-50 px-2 py-2 dark:bg-blue-950"
                >
                  <Ionicons
                    name="pricetags-outline"
                    size={16}
                    color="#2563eb"
                  />
                  <Text className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                    Adicionar do catálogo
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setErro(null);
                    adicionarItemAvulso();
                  }}
                  className="min-h-[48px] flex-1 flex-row items-center justify-center gap-1 rounded-xl border border-slate-300 bg-white px-2 py-2 dark:border-slate-700 dark:bg-slate-900"
                >
                  <Ionicons name="add" size={16} color="#475569" />
                  <Text className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Adicionar item avulso
                  </Text>
                </Pressable>
              </View>

              {itens.length === 0 ? (
                <View className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-8 dark:border-slate-700 dark:bg-slate-900">
                  <Text className="text-center text-base font-semibold text-slate-700 dark:text-slate-200">
                    Nenhum item adicionado
                  </Text>
                  <Text className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
                    Use o catálogo ou adicione um item avulso.
                  </Text>
                </View>
              ) : (
                <View className="mt-3 gap-3">
                  {itens.map((item) => (
                    <OrcamentoItemRow
                      key={item.id}
                      item={item}
                      onUpdate={atualizarItem}
                      onRemove={removerItem}
                    />
                  ))}
                </View>
              )}
            </View>
          </ScrollView>

          <View className="border-t border-slate-200 bg-white px-6 pb-4 pt-3 dark:border-slate-800 dark:bg-slate-900">
            {erro ? (
              <Text className="mb-2 text-sm font-medium text-red-600">
                {erro}
              </Text>
            ) : null}
            {mostrarDicaSalvar ? (
              <Tooltip text="Toque aqui para salvar seu primeiro orçamento." />
            ) : null}
            <View className="flex-row items-center gap-3">
              <View className="flex-1">
                <Text className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                  Total
                </Text>
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.75}
                  className="text-2xl font-bold text-slate-900 dark:text-slate-50"
                >
                  {totalFormatado}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={handleSalvar}
                className="min-h-[52px] items-center justify-center rounded-xl bg-blue-600 px-4"
              >
                <Text className="text-sm font-semibold text-white">
                  {salvarLabel}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>

      {catalogoAberto ? (
        <CatalogoPickerModal
          onClose={() => setCatalogoAberto(false)}
          onSelect={(item) => {
            adicionarDoCatalogo(item);
            setErro(null);
            setCatalogoAberto(false);
          }}
        />
      ) : null}
    </Screen>
  );
}

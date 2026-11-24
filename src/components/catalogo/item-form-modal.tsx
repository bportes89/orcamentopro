import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import { PrimaryButton } from "@/components/ui/primary-button";
import { Screen } from "@/components/ui/screen";
import { TextField } from "@/components/ui/text-field";
import { formatBRL, maskBRLInput, parseBRLInput } from "@/lib/currency";
import {
  UNIDADES_CATALOGO,
  itemCatalogoSchema,
  type ItemCatalogoInput,
  type UnidadeCatalogo,
} from "@/lib/validators";
import type {
  CatalogoItemInput,
  LocalCatalogoItem,
} from "@/services/catalogo";

type ItemFormModalProps = {
  item: LocalCatalogoItem | null;
  descricaoInicial?: string;
  onClose: () => void;
  onSubmit: (input: CatalogoItemInput) => void;
};

function getUnidade(item: LocalCatalogoItem | null): UnidadeCatalogo {
  const unidade = item?.unidade;

  return UNIDADES_CATALOGO.includes(unidade as UnidadeCatalogo)
    ? (unidade as UnidadeCatalogo)
    : "un";
}

export function ItemFormModal({
  item,
  descricaoInicial,
  onClose,
  onSubmit,
}: ItemFormModalProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ItemCatalogoInput>({
    resolver: zodResolver(itemCatalogoSchema),
    defaultValues: {
      nome: item?.descricao ?? descricaoInicial ?? "",
      unidade: getUnidade(item),
      preco: item ? formatBRL(item.precoUnitario) : "",
    },
  });

  const submit = (values: ItemCatalogoInput) => {
    onSubmit({
      descricao: values.nome.trim(),
      unidade: values.unidade,
      precoUnitario: parseBRLInput(values.preco),
    });
  };

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <Screen>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View className="flex-row items-center justify-between px-6 py-4">
            <Text className="text-xl font-bold text-slate-900 dark:text-slate-50">
              {item ? "Editar item" : "Novo item"}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fechar"
              onPress={onClose}
              className="h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800"
            >
              <Ionicons name="close" size={22} color="#64748b" />
            </Pressable>
          </View>

          <ScrollView
            contentContainerClassName="px-6 pb-10"
            keyboardShouldPersistTaps="handled"
          >
            <View className="gap-4">
              <Controller
                control={control}
                name="nome"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextField
                    label="Nome"
                    placeholder="Ex.: Instalação de tomada"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.nome?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="unidade"
                render={({ field: { onChange, value } }) => (
                  <View>
                    <Text className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                      Unidade
                    </Text>
                    <View className="flex-row gap-2">
                      {UNIDADES_CATALOGO.map((unidade) => {
                        const active = value === unidade;

                        return (
                          <Pressable
                            key={unidade}
                            accessibilityRole="button"
                            accessibilityState={{ selected: active }}
                            onPress={() => onChange(unidade)}
                            className={`min-h-[48px] flex-1 items-center justify-center rounded-xl border ${
                              active
                                ? "border-blue-600 bg-blue-50 dark:bg-blue-950"
                                : "border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900"
                            }`}
                          >
                            <Text
                              className={`text-sm font-semibold ${
                                active
                                  ? "text-blue-600"
                                  : "text-slate-700 dark:text-slate-200"
                              }`}
                            >
                              {unidade}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                    {errors.unidade?.message ? (
                      <Text className="mt-1 text-sm text-red-600">
                        {errors.unidade.message}
                      </Text>
                    ) : null}
                  </View>
                )}
              />

              <Controller
                control={control}
                name="preco"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextField
                    label="Preço unitário"
                    placeholder="R$ 0,00"
                    keyboardType="numeric"
                    value={value}
                    onChangeText={(text) => onChange(maskBRLInput(text))}
                    onBlur={onBlur}
                    error={errors.preco?.message}
                  />
                )}
              />

              <PrimaryButton
                label={item ? "Salvar alterações" : "Adicionar item"}
                onPress={handleSubmit(submit)}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Screen>
    </Modal>
  );
}

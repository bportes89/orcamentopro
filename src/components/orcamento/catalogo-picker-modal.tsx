import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "@/components/ui/screen";
import { useCatalogo } from "@/hooks/use-catalogo";
import { formatBRL } from "@/lib/currency";
import { normalizeText } from "@/lib/search";
import type { LocalCatalogoItem } from "@/services/catalogo";

type CatalogoPickerModalProps = {
  onClose: () => void;
  onSelect: (item: LocalCatalogoItem) => void;
};

export function CatalogoPickerModal({
  onClose,
  onSelect,
}: CatalogoPickerModalProps) {
  const { itens, isLoading } = useCatalogo();
  const [busca, setBusca] = useState("");

  const itensFiltrados = useMemo(() => {
    const termo = normalizeText(busca.trim());

    if (!termo) {
      return itens;
    }

    return itens.filter((item) =>
      normalizeText(item.descricao).includes(termo),
    );
  }, [itens, busca]);

  const buscando = busca.trim().length > 0;

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <Screen>
        <View className="flex-row items-center justify-between px-6 py-4">
          <Text className="text-xl font-bold text-slate-900 dark:text-slate-50">
            Adicionar do catálogo
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

        <View className="mx-6 min-h-[48px] flex-row items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-900">
          <Ionicons name="search" size={18} color="#94a3b8" />
          <TextInput
            accessibilityLabel="Buscar itens do catálogo"
            placeholder="Buscar por nome"
            placeholderTextColor="#64748b"
            autoCapitalize="none"
            autoCorrect={false}
            value={busca}
            onChangeText={setBusca}
            className="flex-1 text-base text-slate-900 dark:text-slate-100"
          />
          {busca ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Limpar busca"
              onPress={() => setBusca("")}
              className="h-12 w-12 items-center justify-center"
            >
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </Pressable>
          ) : null}
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : (
          <FlatList
            className="mt-4 flex-1"
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
            data={itensFiltrados}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="button"
                onPress={() => onSelect(item)}
                className="min-h-[64px] flex-row items-center gap-3 rounded-2xl bg-white px-4 py-3 dark:bg-slate-900"
              >
                <View className="flex-1">
                  <Text
                    numberOfLines={1}
                    className="text-base font-semibold text-slate-900 dark:text-slate-50"
                  >
                    {item.descricao}
                  </Text>
                  <View className="mt-1 flex-row items-center gap-2">
                    {item.unidade ? (
                      <Text className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {item.unidade}
                      </Text>
                    ) : null}
                    <Text className="text-sm text-slate-500 dark:text-slate-400">
                      {formatBRL(item.precoUnitario)}
                    </Text>
                  </View>
                </View>
                <Ionicons name="add-circle" size={26} color="#2563eb" />
              </Pressable>
            )}
            ItemSeparatorComponent={() => <View className="h-3" />}
            ListEmptyComponent={
              <View className="items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 dark:border-slate-700 dark:bg-slate-900">
                <Text className="text-center text-base font-semibold text-slate-700 dark:text-slate-200">
                  {buscando
                    ? "Nenhum item encontrado"
                    : "Seu catálogo está vazio"}
                </Text>
                <Text className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
                  {buscando
                    ? "Tente outro termo de busca."
                    : "Cadastre itens no catálogo para adicionar mais rápido."}
                </Text>
              </View>
            }
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        )}
      </Screen>
    </Modal>
  );
}

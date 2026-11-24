import { useMemo, useState } from "react";
import {
  Alert,
  Animated,
  FlatList,
  PanResponder,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { ItemFormModal } from "@/components/catalogo/item-form-modal";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Screen } from "@/components/ui/screen";
import { useCatalogo } from "@/hooks/use-catalogo";
import { useProfile } from "@/hooks/use-profile";
import { formatBRL } from "@/lib/currency";
import { resolveErrorMessage } from "@/lib/resolve-error-message";
import { normalizeText } from "@/lib/search";
import { sugestoesParaOficio } from "@/lib/sugestoes-catalogo";
import type {
  CatalogoItemInput,
  LocalCatalogoItem,
} from "@/services/catalogo";

const SWIPE_ACTION_WIDTH = 96;

type ItemRowProps = {
  item: LocalCatalogoItem;
  onPress: (item: LocalCatalogoItem) => void;
  onDelete: (item: LocalCatalogoItem) => void;
};

function ItemRow({ item, onPress, onDelete }: ItemRowProps) {
  const [translateX] = useState(() => new Animated.Value(0));

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponderCapture: (_event, gesture) =>
          Math.abs(gesture.dx) > 8 &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy),
        onPanResponderMove: (_event, gesture) => {
          translateX.setValue(
            Math.max(-SWIPE_ACTION_WIDTH, Math.min(0, gesture.dx)),
          );
        },
        onPanResponderRelease: (_event, gesture) => {
          Animated.spring(translateX, {
            toValue: gesture.dx < -SWIPE_ACTION_WIDTH / 2 ? -SWIPE_ACTION_WIDTH : 0,
            useNativeDriver: true,
            bounciness: 0,
          }).start();
        },
        onPanResponderTerminate: () => {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 0,
          }).start();
        },
        onPanResponderTerminationRequest: () => false,
      }),
    [translateX],
  );

  const closeSwipe = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 0,
    }).start();
  };

  return (
    <View className="relative overflow-hidden rounded-2xl">
      <View className="absolute inset-y-0 right-0 w-24 items-center justify-center bg-red-600">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Excluir ${item.descricao}`}
          onPress={() => {
            closeSwipe();
            onDelete(item);
          }}
          className="h-full w-full items-center justify-center"
        >
          <Ionicons name="trash-outline" size={22} color="#ffffff" />
          <Text className="mt-1 text-xs font-semibold text-white">Excluir</Text>
        </Pressable>
      </View>

      <Animated.View
        style={{ transform: [{ translateX }] }}
        {...panResponder.panHandlers}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Editar ${item.descricao}`}
          accessibilityHint="Abre o formulário para editar o item"
          onPress={() => {
            closeSwipe();
            onPress(item);
          }}
          className="min-h-[72px] flex-row items-center gap-3 rounded-2xl bg-white px-4 py-3 dark:bg-slate-900"
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
          <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
        </Pressable>
      </Animated.View>
    </View>
  );
}

export default function CatalogoScreen() {
  const {
    itens,
    isLoading,
    isError,
    error,
    retry,
    criar,
    atualizar,
    deletar,
  } = useCatalogo();
  const [busca, setBusca] = useState("");
  const [editor, setEditor] = useState<
    LocalCatalogoItem | null | undefined
  >(undefined);
  const [descricaoSugerida, setDescricaoSugerida] = useState<string | null>(
    null,
  );
  const { profile } = useProfile();
  const sugestoes = sugestoesParaOficio(profile?.oficio ?? null);

  const abrirNovo = (descricao?: string) => {
    setDescricaoSugerida(descricao ?? null);
    abrirNovo();
  };

  const itensFiltrados = useMemo(() => {
    const termo = normalizeText(busca.trim());

    if (!termo) {
      return itens;
    }

    return itens.filter((item) =>
      normalizeText(item.descricao).includes(termo),
    );
  }, [itens, busca]);

  const handleSubmit = (input: CatalogoItemInput) => {
    const current = editor;
    setEditor(undefined);
    setDescricaoSugerida(null);

    const onError = (error: unknown) => {
      Alert.alert(
        "Não foi possível salvar o item",
        resolveErrorMessage(error),
      );
    };

    if (current) {
      atualizar.mutate({ id: current.id, input }, { onError });
      return;
    }

    criar.mutate(input, { onError });
  };

  const handleDelete = (item: LocalCatalogoItem) => {
    Alert.alert("Excluir item", `Remover "${item.descricao}" do catálogo?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: () => {
          deletar.mutate(item.id, {
            onError: (error) => {
              Alert.alert(
                "Não foi possível excluir o item",
                resolveErrorMessage(error),
              );
            },
          });
        },
      },
    ]);
  };

  return (
    <Screen>
      <View className="flex-1">
        <View className="px-6 pt-6">
          <Text className="text-3xl font-bold text-slate-900 dark:text-slate-50">
            Catálogo
          </Text>
          <Text className="mt-2 text-base text-slate-500 dark:text-slate-400">
            Seus serviços e preços mais usados.
          </Text>

          <View className="mt-5 min-h-[48px] flex-row items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-900">
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

          <View className="mt-4">
            <Text className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Sugestões para você
            </Text>
            <View className="mt-2 flex-row flex-wrap gap-2">
              {sugestoes.map((descricao) => (
                <Pressable
                  key={descricao}
                  accessibilityRole="button"
                  accessibilityLabel={`Cadastrar ${descricao}`}
                  onPress={() => abrirNovo(descricao)}
                  className="min-h-[44px] items-center justify-center rounded-full border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-900"
                >
                  <Text className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    + {descricao}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {isLoading ? (
          <LoadingScreen label="Carregando seu catálogo..." />
        ) : isError && itens.length === 0 ? (
          <ErrorState
            title="Não foi possível carregar o catálogo"
            message={resolveErrorMessage(error)}
            actionLabel="Tentar novamente"
            onAction={retry}
            retryAccessibilityLabel="Tentar carregar o catálogo novamente"
          />
        ) : (
          <FlatList
            className="mt-4 flex-1"
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
            data={itensFiltrados}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ItemRow
                item={item}
                onPress={setEditor}
                onDelete={handleDelete}
              />
            )}
            ItemSeparatorComponent={() => <View className="h-3" />}
            ListEmptyComponent={
              busca.trim().length > 0 ? (
                <EmptyState
                  compact
                  icon="search-outline"
                  title="Nenhum item encontrado"
                  subtitle="Tente outro termo de busca."
                />
              ) : (
                <EmptyState
                  compact
                  icon="pricetags-outline"
                  title="Seu catálogo está vazio"
                  subtitle="Cadastre seu primeiro serviço para orçar mais rápido."
                  actionLabel="Cadastrar item"
                  onAction={() => abrirNovo()}
                />
              )
            }
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Novo item"
          onPress={() => abrirNovo()}
          className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-blue-600 shadow-lg"
        >
          <Ionicons name="add" size={28} color="#ffffff" />
        </Pressable>
      </View>

      {editor !== undefined ? (
        <ItemFormModal
          item={editor}
          descricaoInicial={descricaoSugerida ?? undefined}
          onClose={() => {
            setEditor(undefined);
            setDescricaoSugerida(null);
          }}
          onSubmit={handleSubmit}
        />
      ) : null}
    </Screen>
  );
}

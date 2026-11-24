import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";

import { ItemFormModal } from "@/components/catalogo/item-form-modal";
import { PrimaryButton } from "@/components/ui/primary-button";
import { Screen } from "@/components/ui/screen";
import { useAuth } from "@/hooks/use-auth";
import { useCatalogo } from "@/hooks/use-catalogo";
import { resolveErrorMessage } from "@/lib/resolve-error-message";
import { sugestoesParaOficio } from "@/lib/sugestoes-catalogo";
import {
  getLocalProfile,
  type LocalProfile,
} from "@/services/profiles";
import type {
  CatalogoItemInput,
  LocalCatalogoItem,
} from "@/services/catalogo";

export default function OnboardingCatalogoScreen() {
  const { user } = useAuth();
  const { itens, criar } = useCatalogo();
  const [editor, setEditor] = useState<LocalCatalogoItem | null | undefined>(
    undefined,
  );
  const [descricaoSugerida, setDescricaoSugerida] = useState<string | null>(
    null,
  );

  const perfil: LocalProfile | null = user ? getLocalProfile(user.id) : null;
  const sugestoes = sugestoesParaOficio(perfil?.oficio ?? null);
  const cadastrados = Math.min(itens.length, 3);

  const abrirNovo = (descricao?: string) => {
    setDescricaoSugerida(descricao ?? null);
    setEditor(null);
  };

  const handleSubmit = (input: CatalogoItemInput) => {
    setEditor(undefined);
    setDescricaoSugerida(null);

    criar.mutate(input, {
      onError: (error) => {
        Alert.alert(
          "Não foi possível salvar o item",
          resolveErrorMessage(error),
        );
      },
    });
  };

  const continuar = () => {
    router.push("/onboarding/perfil");
  };

  const pular = () => {
    router.push("/onboarding/perfil");
  };

  return (
    <Screen>
      <ScrollView contentContainerClassName="px-6 pb-8 pt-8">
        <Text className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
          Passo 2 de 3
        </Text>
        <Text className="mt-3 text-3xl font-bold text-slate-900 dark:text-slate-50">
          Cadastre seus 3 serviços mais comuns
        </Text>
        <Text className="mt-3 text-base text-slate-500 dark:text-slate-400">
          {cadastrados}/3 cadastrados. Você pode pular e adicionar depois.
        </Text>

        <View className="mt-6 rounded-2xl bg-blue-50 p-4 dark:bg-blue-950">
          <Text className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
            Sugestões para você
          </Text>
          <View className="mt-3 flex-row flex-wrap gap-2">
            {sugestoes.map((descricao) => (
              <Pressable
                key={descricao}
                accessibilityRole="button"
                accessibilityLabel={`Cadastrar ${descricao}`}
                onPress={() => abrirNovo(descricao)}
                className="min-h-[44px] items-center justify-center rounded-full border border-blue-300 bg-white px-4 dark:border-blue-800 dark:bg-slate-900"
              >
                <Text className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  + {descricao}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Adicionar serviço"
          onPress={() => abrirNovo()}
          className="mt-5 min-h-[56px] items-center justify-center rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900"
        >
          <Text className="text-base font-semibold text-slate-700 dark:text-slate-200">
            Adicionar outro serviço
          </Text>
        </Pressable>

        <View className="mt-5 gap-2">
          {itens.slice(0, 3).map((item) => (
            <View
              key={item.id}
              className="rounded-xl bg-white px-4 py-3 dark:bg-slate-900"
            >
              <Text className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {item.descricao}
              </Text>
            </View>
          ))}
        </View>

        <View className="mt-8">
          <PrimaryButton label="Continuar" onPress={continuar} />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Pular esta etapa"
          onPress={pular}
          className="mt-5 min-h-[48px] items-center justify-center"
        >
          <Text className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Pular
          </Text>
        </Pressable>
      </ScrollView>

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

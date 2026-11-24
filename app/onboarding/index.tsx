import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";

import { PrimaryButton } from "@/components/ui/primary-button";
import { Screen } from "@/components/ui/screen";
import { useAuth } from "@/hooks/use-auth";
import { OFICIOS, type Oficio } from "@/lib/sugestoes-catalogo";
import { salvarOnboarding } from "@/services/profiles";

export default function OnboardingOficioScreen() {
  const { user } = useAuth();
  const [oficio, setOficio] = useState<Oficio | null>(null);

  const continuar = () => {
    if (!user || !oficio) {
      return;
    }

    salvarOnboarding(user.id, { oficio });
    router.push("/onboarding/catalogo");
  };

  const pular = () => {
    router.push("/onboarding/catalogo");
  };

  return (
    <Screen>
      <ScrollView contentContainerClassName="px-6 pb-8 pt-8">
        <Text className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
          Passo 1 de 3
        </Text>
        <Text className="mt-3 text-3xl font-bold text-slate-900 dark:text-slate-50">
          Quanto tempo você perde fazendo orçamento?
        </Text>
        <Text className="mt-3 text-base text-slate-500 dark:text-slate-400">
          Escolha seu ofício para deixarmos as sugestões de serviços prontas para
          você.
        </Text>

        <View className="mt-8 gap-3">
          {OFICIOS.map((opcao) => {
            const selecionado = oficio === opcao.valor;

            return (
              <Pressable
                key={opcao.valor}
                accessibilityRole="button"
                accessibilityLabel={`Escolher ofício ${opcao.label}`}
                accessibilityState={{ selected: selecionado }}
                onPress={() => setOficio(opcao.valor)}
                className={`min-h-[56px] flex-row items-center justify-between rounded-xl border px-4 ${
                  selecionado
                    ? "border-blue-600 bg-blue-50 dark:bg-blue-950"
                    : "border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900"
                }`}
              >
                <Text
                  className={`text-base font-semibold ${
                    selecionado
                      ? "text-blue-700 dark:text-blue-300"
                      : "text-slate-700 dark:text-slate-200"
                  }`}
                >
                  {opcao.label}
                </Text>
                {selecionado ? (
                  <Text className="text-lg font-bold text-blue-600">✓</Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        <View className="mt-8">
          <PrimaryButton
            label="Continuar"
            disabled={!oficio}
            onPress={continuar}
          />
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
    </Screen>
  );
}

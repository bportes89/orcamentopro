import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";

import { PrimaryButton } from "@/components/ui/primary-button";
import { Screen } from "@/components/ui/screen";
import { TextField } from "@/components/ui/text-field";
import { useAuth } from "@/hooks/use-auth";
import { formatPhoneBR } from "@/lib/masks";
import {
  getLocalProfile,
  marcarOnboardingConcluido,
  saveLocalProfile,
} from "@/services/profiles";

export default function OnboardingPerfilScreen() {
  const { user } = useAuth();
  const perfil = user ? getLocalProfile(user.id) : null;
  const [nome, setNome] = useState(perfil?.nome ?? "");
  const [telefone, setTelefone] = useState(perfil?.telefone ?? "");
  const [chavePix, setChavePix] = useState(perfil?.chavePix ?? "");

  const irParaOrcamento = () => {
    router.replace({
      pathname: "/orcamento/novo",
      params: { dica: "1" },
    });
  };

  const continuar = () => {
    if (user) {
      saveLocalProfile(user.id, {
        nome: nome.trim() || perfil?.nome || "Prestador de serviços",
        telefone,
        chavePix,
      });
      marcarOnboardingConcluido(user.id);
    }

    irParaOrcamento();
  };

  const pular = () => {
    irParaOrcamento();
  };

  return (
    <Screen>
      <ScrollView contentContainerClassName="px-6 pb-8 pt-8">
        <Text className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
          Passo 3 de 3
        </Text>
        <Text className="mt-3 text-3xl font-bold text-slate-900 dark:text-slate-50">
          Seus dados no PDF
        </Text>
        <Text className="mt-3 text-base text-slate-500 dark:text-slate-400">
          Usamos essas informações no cabeçalho e no rodapé dos seus
          orçamentos. Você pode alterar depois no perfil.
        </Text>

        <View className="mt-8 gap-4">
          <TextField
            label="Nome ou nome do negócio"
            placeholder="Seu nome ou nome do negócio"
            value={nome}
            onChangeText={setNome}
          />
          <TextField
            label="Telefone"
            placeholder="(11) 99999-9999"
            keyboardType="phone-pad"
            value={telefone}
            onChangeText={(texto) => setTelefone(formatPhoneBR(texto))}
          />
          <TextField
            label="Chave Pix"
            placeholder="CPF, e-mail, telefone ou chave aleatória"
            autoCapitalize="none"
            value={chavePix}
            onChangeText={setChavePix}
          />
        </View>

        <View className="mt-8">
          <PrimaryButton
            label="Salvar e criar orçamento"
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

import { Alert } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";

import {
  OrcamentoForm,
  type OrcamentoFormSubmission,
} from "@/components/orcamento/orcamento-form";
import { useAuth } from "@/hooks/use-auth";
import { criarOrcamento } from "@/services/orcamentos";
import { marcarOnboardingConcluido } from "@/services/profiles";

export default function NovoOrcamentoScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ dica?: string }>();
  const mostrarDicaSalvar = params.dica === "1";

  const handleSalvar = (dados: OrcamentoFormSubmission) => {
    if (!user) {
      Alert.alert("Sessão expirada", "Entre novamente para salvar o orçamento.");
      return;
    }

    try {
      const orcamento = criarOrcamento(user.id, {
        clienteNome: dados.clienteNome,
        clienteTelefone: dados.clienteTelefone,
        validadeDias: dados.validadeDias,
        observacoes: dados.observacoes,
        itens: dados.itens,
      });

      marcarOnboardingConcluido(user.id);
      queryClient.invalidateQueries({ queryKey: ["orcamentos"] });

      router.replace({
        pathname: "/orcamento/[id]",
        params: { id: orcamento.id },
      });
    } catch {
      Alert.alert(
        "Não foi possível salvar",
        "Revise os dados e tente novamente.",
      );
    }
  };

  return (
    <OrcamentoForm
      title="Novo orçamento"
      mostrarDicaSalvar={mostrarDicaSalvar}
      onVoltar={() => router.back()}
      onSalvar={handleSalvar}
    />
  );
}

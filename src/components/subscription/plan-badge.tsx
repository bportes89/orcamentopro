import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { useSubscription } from "@/hooks/use-subscription";

export function PlanBadge() {
  const {
    isPro,
    orcamentosRestantes,
    loading,
    statusLabel,
    billingIssue,
    gracePeriod,
  } = useSubscription();

  if (loading) {
    return (
      <Text className="text-xs font-medium text-slate-500 dark:text-slate-400">
        Verificando plano...
      </Text>
    );
  }

  const atencao = billingIssue || gracePeriod;
  const classes = atencao
    ? {
        fundo: "bg-amber-100 dark:bg-amber-950",
        texto: "text-amber-700 dark:text-amber-300",
        icone: "#b45309",
      }
    : isPro
      ? {
          fundo: "bg-violet-100 dark:bg-violet-950",
          texto: "text-violet-700 dark:text-violet-300",
          icone: "#7c3aed",
        }
      : {
          fundo: "bg-slate-100 dark:bg-slate-800",
          texto: "text-slate-600 dark:text-slate-300",
          icone: "#475569",
        };

  return (
    <View
      className={`self-start flex-row items-center gap-1.5 rounded-full px-3 py-1 ${classes.fundo}`}
    >
      <Ionicons
        name={
          atencao
            ? "alert-circle-outline"
            : isPro
              ? "star"
              : "pricetag-outline"
        }
        size={13}
        color={classes.icone}
      />
      <Text className={`text-xs font-semibold ${classes.texto}`}>
        {atencao || isPro
          ? statusLabel
          : `Gratuito · ${orcamentosRestantes} restantes neste mês`}
      </Text>
    </View>
  );
}

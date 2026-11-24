import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { useSubscription } from "@/hooks/use-subscription";
import { ErrorState } from "@/components/ui/error-state";
import { PrimaryButton } from "@/components/ui/primary-button";
import { Screen } from "@/components/ui/screen";

const BENEFICIOS = [
  "Orçamentos ilimitados, sem contagem mensal",
  "PDF personalizado com sua logo e dados",
  "Envio rápido pelo WhatsApp",
  "Catálogo de serviços ilimitado",
];

export default function PaywallScreen() {
  const {
    isPro,
    pacoteMensal,
    purchasing,
    restoring,
    estadoCompra,
    erroCompra,
    billingIssue,
    gracePeriod,
    comprar,
    restaurar,
  } = useSubscription();

  const assinar = () => {
    if (!pacoteMensal) {
      Alert.alert(
        "Oferta indisponível",
        "Não foi possível carregar a assinatura agora. Tente novamente.",
      );
      return;
    }

    void comprar(pacoteMensal);
  };

  const restaurarCompra = () => {
    void restaurar();
  };

  return (
    <Screen>
      <ScrollView contentContainerClassName="px-6 pb-8 pt-6">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar paywall"
          onPress={() => router.back()}
          className="h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800"
        >
          <Ionicons name="close" size={22} color="#475569" />
        </Pressable>

        <View className="mt-8 items-center">
          <View className="h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-950">
            <Ionicons name="star" size={32} color="#7c3aed" />
          </View>
          <Text className="mt-5 text-center text-3xl font-bold text-slate-900 dark:text-slate-50">
            OrçamentoPro Pro
          </Text>
          <Text className="mt-3 text-center text-base text-slate-500 dark:text-slate-400">
            {isPro
              ? "Sua assinatura está ativa. Obrigado por apoiar o app!"
              : "Você criou 5 orçamentos neste mês. Continue sem limites com o Plano Pro."}
          </Text>
        </View>

        {billingIssue ? (
          <View className="mt-6 rounded-2xl bg-amber-50 p-4 dark:bg-amber-950">
            <Text className="text-center text-sm text-amber-800 dark:text-amber-200">
              Houve um problema com a cobrança. Atualize os dados do pagamento na
              loja para continuar com o Pro.
            </Text>
          </View>
        ) : null}

        {gracePeriod ? (
          <View className="mt-6 rounded-2xl bg-amber-50 p-4 dark:bg-amber-950">
            <Text className="text-center text-sm text-amber-800 dark:text-amber-200">
              Seu pagamento está em período de tolerância. Você continua com
              acesso Pro enquanto a loja tenta cobrar novamente.
            </Text>
          </View>
        ) : null}

        {estadoCompra === "pendente" ? (
          <Text className="mt-6 text-center text-sm font-medium text-blue-600 dark:text-blue-400">
            Aguardando a loja confirmar a compra...
          </Text>
        ) : null}

        {estadoCompra === "cancelado" ? (
          <Text className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Compra cancelada. Sua assinatura permanece como estava.
          </Text>
        ) : null}

        {erroCompra ? (
          <View className="mt-6">
            <ErrorState
              compact
              title="Não foi possível concluir"
              message={erroCompra}
              actionLabel="Tentar novamente"
              onAction={assinar}
              retryAccessibilityLabel="Tentar assinar novamente"
            />
          </View>
        ) : null}

        {!isPro ? (
          <>
            <View className="mt-8 rounded-2xl border border-violet-200 bg-violet-50 p-5 dark:border-violet-900 dark:bg-violet-950">
              {BENEFICIOS.map((beneficio) => (
                <View key={beneficio} className="flex-row items-start gap-3 py-1.5">
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color="#7c3aed"
                  />
                  <Text className="flex-1 text-sm text-slate-700 dark:text-slate-200">
                    {beneficio}
                  </Text>
                </View>
              ))}
            </View>

            <View className="mt-6 items-center">
              <Text className="text-sm text-slate-500 dark:text-slate-400">
                Assinatura mensal
              </Text>
              <Text className="mt-1 text-3xl font-bold text-slate-900 dark:text-slate-50">
                {pacoteMensal?.product.priceString ?? "R$ 19,90"}
                <Text className="text-base font-medium text-slate-500">
                  {" "}
                  /mês
                </Text>
              </Text>
            </View>

            <View className="mt-6">
              <PrimaryButton
                label="Assinar Plano Pro"
                loading={purchasing}
                disabled={!pacoteMensal || restoring}
                onPress={assinar}
              />
            </View>
          </>
        ) : (
          <View className="mt-8 rounded-2xl bg-emerald-50 p-5 dark:bg-emerald-950">
            <Text className="text-center text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              Plano ativo — todos os recursos liberados.
            </Text>
          </View>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Restaurar compra"
          accessibilityState={{ busy: restoring, disabled: restoring }}
          disabled={restoring}
          onPress={restaurarCompra}
          className="mt-6 min-h-[48px] items-center justify-center"
        >
          <Text className="text-sm font-semibold text-blue-600 dark:text-blue-400">
            {restoring ? "Restaurando compra..." : "Restaurar compra"}
          </Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

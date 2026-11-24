import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Link } from "expo-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import { PrimaryButton } from "@/components/ui/primary-button";
import { Screen } from "@/components/ui/screen";
import { TextField } from "@/components/ui/text-field";
import { useAuth } from "@/hooks/use-auth";
import { resolveErrorMessage } from "@/lib/resolve-error-message";
import {
  recuperarSenhaSchema,
  type RecuperarSenhaInput,
} from "@/lib/validators";

export default function RecuperarSenhaScreen() {
  const { resetPassword } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RecuperarSenhaInput>({
    resolver: zodResolver(recuperarSenhaSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: RecuperarSenhaInput) => {
    setFormError(null);

    try {
      const email = values.email.trim();
      await resetPassword(email);
      setSentTo(email);
    } catch (error) {
      setFormError(resolveErrorMessage(error));
    }
  };

  if (sentTo) {
    return (
      <Screen>
        <ScrollView contentContainerClassName="flex-grow justify-center px-6 py-10">
          <Text className="text-sm font-bold uppercase tracking-widest text-blue-600">
            OrçamentoPro
          </Text>
          <Text className="mt-3 text-3xl font-bold text-slate-900 dark:text-slate-50">
            Verifique seu e-mail
          </Text>
          <Text className="mt-3 text-base text-slate-500 dark:text-slate-400">
            Se existir uma conta para {sentTo}, enviamos um link para redefinir
            sua senha. Confira também a caixa de spam.
          </Text>

          <View className="mt-8">
            <Link href="/login" asChild>
              <Pressable className="items-center py-3">
                <Text className="text-base font-semibold text-blue-600">
                  Voltar para o login
                </Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerClassName="flex-grow justify-center px-6 py-10"
          keyboardShouldPersistTaps="handled"
        >
          <Text className="text-sm font-bold uppercase tracking-widest text-blue-600">
            OrçamentoPro
          </Text>
          <Text className="mt-3 text-3xl font-bold text-slate-900 dark:text-slate-50">
            Recuperar senha
          </Text>
          <Text className="mt-2 text-base text-slate-500 dark:text-slate-400">
            Informe seu e-mail e enviaremos um link para redefinir sua senha.
          </Text>

          <View className="mt-8 gap-4">
            {formError ? (
              <View className="rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950">
                <Text className="text-sm text-red-700 dark:text-red-300">
                  {formError}
                </Text>
              </View>
            ) : null}

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  label="E-mail"
                  placeholder="voce@exemplo.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  inputMode="email"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.email?.message}
                />
              )}
            />

            <PrimaryButton
              label="Enviar link"
              loading={isSubmitting}
              onPress={handleSubmit(onSubmit)}
            />
          </View>

          <View className="mt-8 items-center">
            <Link href="/login" asChild>
              <Pressable className="py-1">
                <Text className="text-sm font-semibold text-blue-600">
                  Voltar para o login
                </Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

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
import { loginSchema, type LoginInput } from "@/lib/validators";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", senha: "" },
  });

  const onSubmit = async (values: LoginInput) => {
    setFormError(null);

    try {
      await signIn(values.email.trim(), values.senha);
    } catch (error) {
      setFormError(resolveErrorMessage(error));
    }
  };

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
            Bem-vindo de volta
          </Text>
          <Text className="mt-2 text-base text-slate-500 dark:text-slate-400">
            Entre para gerenciar seus orçamentos.
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

            <Controller
              control={control}
              name="senha"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  label="Senha"
                  placeholder="Sua senha"
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="password"
                  textContentType="password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.senha?.message}
                />
              )}
            />

            <Link href="/recuperar-senha" asChild>
              <Pressable className="self-end py-1">
                <Text className="text-sm font-medium text-blue-600">
                  Esqueci minha senha
                </Text>
              </Pressable>
            </Link>

            <PrimaryButton
              label="Entrar"
              loading={isSubmitting}
              onPress={handleSubmit(onSubmit)}
            />
          </View>

          <View className="mt-8 flex-row items-center justify-center gap-1">
            <Text className="text-sm text-slate-500 dark:text-slate-400">
              Não tem uma conta?
            </Text>
            <Link href="/cadastro" asChild>
              <Pressable className="py-1">
                <Text className="text-sm font-semibold text-blue-600">
                  Criar conta
                </Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

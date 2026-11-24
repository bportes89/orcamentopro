import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Link, router } from "expo-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import { PrimaryButton } from "@/components/ui/primary-button";
import { Screen } from "@/components/ui/screen";
import { TextField } from "@/components/ui/text-field";
import { useAuth } from "@/hooks/use-auth";
import { resolveErrorMessage } from "@/lib/resolve-error-message";
import { cadastroSchema, type CadastroInput } from "@/lib/validators";

export default function CadastroScreen() {
  const { signUp } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CadastroInput>({
    resolver: zodResolver(cadastroSchema),
    defaultValues: { nome: "", email: "", telefone: "", senha: "" },
  });

  const onSubmit = async (values: CadastroInput) => {
    setFormError(null);

    try {
      const { session } = await signUp({
        nome: values.nome.trim(),
        email: values.email.trim(),
        telefone: values.telefone.trim(),
        senha: values.senha,
      });

      if (!session) {
        Alert.alert(
          "Conta criada",
          "Enviamos um link de confirmação para o seu e-mail. Confirme antes de entrar.",
          [{ text: "Ok", onPress: () => router.replace("/login") }],
        );
      }
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
            Criar conta
          </Text>
          <Text className="mt-2 text-base text-slate-500 dark:text-slate-400">
            Cadastre-se para criar e enviar orçamentos.
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
              name="nome"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  label="Nome"
                  placeholder="Seu nome completo"
                  autoComplete="name"
                  textContentType="name"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.nome?.message}
                />
              )}
            />

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
              name="telefone"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  label="Telefone"
                  placeholder="(11) 99999-9999"
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  textContentType="telephoneNumber"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.telefone?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="senha"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  label="Senha"
                  placeholder="Mínimo de 6 caracteres"
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="new-password"
                  textContentType="newPassword"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.senha?.message}
                />
              )}
            />

            <PrimaryButton
              label="Criar conta"
              loading={isSubmitting}
              onPress={handleSubmit(onSubmit)}
            />
          </View>

          <View className="mt-8 flex-row items-center justify-center gap-1">
            <Text className="text-sm text-slate-500 dark:text-slate-400">
              Já tem uma conta?
            </Text>
            <Link href="/login" asChild>
              <Pressable className="py-1">
                <Text className="text-sm font-semibold text-blue-600">
                  Entrar
                </Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";

import { PlanBadge } from "@/components/subscription/plan-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { PrimaryButton } from "@/components/ui/primary-button";
import { Screen } from "@/components/ui/screen";
import { TextField } from "@/components/ui/text-field";
import { Toast, type ToastMessage } from "@/components/ui/toast";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { formatPhoneBR } from "@/lib/masks";
import { resolveErrorMessage } from "@/lib/resolve-error-message";
import { perfilDadosSchema, type PerfilDadosInput } from "@/lib/validators";

export default function PerfilScreen() {
  const { user, signOut } = useAuth();
  const { profile, uploadingLogo, save, changeLogo } = useProfile();
  const [signingOut, setSigningOut] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PerfilDadosInput>({
    resolver: zodResolver(perfilDadosSchema),
    defaultValues: { nome: "", telefone: "", chave_pix: "" },
  });

  const chavePixValue = useWatch({ control, name: "chave_pix" }) ?? "";

  useEffect(() => {
    if (!profile) {
      return;
    }

    reset({
      nome: profile.nome,
      telefone: formatPhoneBR(profile.telefone ?? ""),
      chave_pix: profile.chavePix ?? "",
    });
  }, [profile, reset]);

  const showToast = useCallback((text: string) => {
    setToast({ id: Date.now(), text });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  const selecionarLogo = async (usarCamera: boolean) => {
    setLogoError(null);

    const permissao = usarCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissao.granted) {
      Alert.alert(
        "Permissão necessária",
        usarCamera
          ? "Libere o acesso à câmera nas configurações do aparelho para tirar a foto da logo."
          : "Libere o acesso às suas fotos nas configurações do aparelho para escolher a logo.",
      );
      return;
    }

    const opcoes = {
      allowsEditing: true,
      aspect: [1, 1] as [number, number],
      quality: 0.9,
    };

    const result = usarCamera
      ? await ImagePicker.launchCameraAsync(opcoes)
      : await ImagePicker.launchImageLibraryAsync({
          ...opcoes,
          mediaTypes: ["images"],
        });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];

    if (!asset?.uri) {
      return;
    }

    try {
      await changeLogo(asset.uri);
      showToast("Logo atualizada");
    } catch (error) {
      setLogoError(resolveErrorMessage(error));
    }
  };

  const pickLogo = () => {
    Alert.alert("Logo do perfil", "Como você quer adicionar a logo?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Tirar foto",
        onPress: () => {
          void selecionarLogo(true);
        },
      },
      {
        text: "Escolher da galeria",
        onPress: () => {
          void selecionarLogo(false);
        },
      },
    ]);
  };

  const onSubmit = async (values: PerfilDadosInput) => {
    setFormError(null);

    try {
      await save({
        nome: values.nome,
        telefone: values.telefone,
        chavePix: values.chave_pix,
      });
      showToast("Perfil salvo");
    } catch (error) {
      setFormError(resolveErrorMessage(error));
    }
  };

  const handleCopyPix = async () => {
    const chave = chavePixValue.trim();

    if (!chave) {
      return;
    }

    await Clipboard.setStringAsync(chave);
    showToast("Chave Pix copiada");
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    setFormError(null);

    try {
      await signOut();
    } catch (error) {
      setFormError(resolveErrorMessage(error));
      setSigningOut(false);
    }
  };

  const initial = (profile?.nome || user?.email || "?").charAt(0).toUpperCase();
  const hasPix = chavePixValue.trim().length > 0;

  if (!profile) {
    return (
      <Screen>
        <LoadingScreen label="Carregando seu perfil..." />
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
          contentContainerClassName="px-6 py-6"
          keyboardShouldPersistTaps="handled"
        >
          <Text className="text-3xl font-bold text-slate-900 dark:text-slate-50">
            Perfil
          </Text>
          <Text className="mt-2 text-base text-slate-500 dark:text-slate-400">
            Configure os dados do seu negócio.
          </Text>

          <View className="mt-6 items-center">
            {profile?.logoUrl ? (
              <Image
                source={{ uri: profile.logoUrl }}
                className="h-24 w-24 rounded-full"
                resizeMode="cover"
              />
            ) : (
              <View className="h-24 w-24 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950">
                <Text className="text-3xl font-bold text-blue-600">
                  {initial}
                </Text>
              </View>
            )}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                profile.logoUrl ? "Alterar logo do perfil" : "Adicionar logo ao perfil"
              }
              accessibilityState={{ busy: uploadingLogo, disabled: uploadingLogo }}
              disabled={uploadingLogo}
              onPress={pickLogo}
              className={`mt-4 min-h-[48px] flex-row items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 dark:border-slate-700 ${
                uploadingLogo ? "opacity-60" : ""
              }`}
            >
              {uploadingLogo ? (
                <ActivityIndicator color="#2563eb" />
              ) : null}
              <Text className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {uploadingLogo
                  ? "Enviando logo..."
                  : profile?.logoUrl
                    ? "Alterar logo"
                    : "Adicionar logo"}
              </Text>
            </Pressable>

            {logoError ? (
              <ErrorState
                compact
                title="Não foi possível atualizar a logo"
                message={logoError}
                actionLabel="Tentar novamente"
                onAction={() => {
                  void pickLogo();
                }}
                retryAccessibilityLabel="Tentar atualizar a logo novamente"
              />
            ) : null}

            <Text className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              {user?.email ?? ""}
            </Text>
          </View>

          <View className="mt-6 items-center gap-3">
            <PlanBadge />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Gerenciar assinatura"
              onPress={() => router.push("/paywall")}
              className="min-h-[48px] items-center justify-center rounded-xl border border-slate-300 px-5 dark:border-slate-700"
            >
              <Text className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Gerenciar assinatura
              </Text>
            </Pressable>
          </View>

          <View className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950">
            <Text className="text-sm text-amber-800 dark:text-amber-200">
              Esses dados aparecem no seu orçamento em PDF.
            </Text>
          </View>

          <View className="mt-6 gap-4">
            {formError ? (
              <ErrorState
                compact
                title="Não foi possível salvar o perfil"
                message={formError}
                actionLabel="Tentar novamente"
                onAction={() => {
                  void handleSubmit(onSubmit)();
                }}
                retryAccessibilityLabel="Tentar salvar o perfil novamente"
              />
            ) : null}

            <Controller
              control={control}
              name="nome"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  label="Nome"
                  placeholder="Seu nome ou nome do negócio"
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
              name="telefone"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  label="Telefone"
                  placeholder="(11) 99999-9999"
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  textContentType="telephoneNumber"
                  value={value}
                  onChangeText={(text) => onChange(formatPhoneBR(text))}
                  onBlur={onBlur}
                  error={errors.telefone?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="chave_pix"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  label="Chave Pix"
                  placeholder="CPF, e-mail, telefone ou chave aleatória"
                  autoCapitalize="none"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.chave_pix?.message}
                />
              )}
            />

            {hasPix ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Copiar chave Pix"
                onPress={handleCopyPix}
                className="min-h-[48px] flex-row items-center justify-center rounded-xl border border-slate-300 px-4 dark:border-slate-700"
              >
                <Text className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Copiar chave Pix
                </Text>
              </Pressable>
            ) : (
              <EmptyState
                compact
                icon="key-outline"
                title="Chave Pix não cadastrada"
                subtitle="Informe uma chave acima para facilitar o recebimento."
              />
            )}

            <PrimaryButton
              label="Salvar alterações"
              loading={isSubmitting}
              onPress={handleSubmit(onSubmit)}
            />

            <Text className="text-center text-xs text-slate-500 dark:text-slate-400">
              As alterações ficam salvas no aparelho mesmo sem internet.
            </Text>
          </View>

          <View className="mt-10">
            <PrimaryButton
              label={signingOut ? "Saindo..." : "Sair"}
              loading={signingOut}
              onPress={handleSignOut}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Toast toast={toast} onHide={hideToast} />
    </Screen>
  );
}

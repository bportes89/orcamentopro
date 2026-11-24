import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

type ErrorStateProps = {
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onRetry?: () => void;
  retryAccessibilityLabel?: string;
  disabled?: boolean;
  compact?: boolean;
};

export function ErrorState({
  title = "Não foi possível carregar os dados",
  message,
  actionLabel = "Tentar novamente",
  onAction,
  onRetry,
  retryAccessibilityLabel,
  disabled,
  compact = false,
}: ErrorStateProps) {
  return (
    <View className={compact ? "items-center px-4 py-8" : "flex-1 items-center justify-center px-6 py-10"}>
      <Ionicons name="alert-circle-outline" size={compact ? 40 : 56} color="#dc2626" />
      <Text className="mt-4 text-center text-lg font-semibold text-slate-900 dark:text-slate-50">
        {title}
      </Text>
      <Text className="mt-2 text-center text-sm text-slate-600 dark:text-slate-300">
        {message}
      </Text>
      {(onAction ?? onRetry) ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={retryAccessibilityLabel ?? actionLabel}
          disabled={disabled}
          onPress={onAction ?? onRetry}
          className="mt-6 min-h-[48px] items-center justify-center rounded-xl bg-blue-600 px-5"
        >
          <Text className="text-sm font-semibold text-white">
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

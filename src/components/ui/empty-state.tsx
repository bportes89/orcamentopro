import type { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

type EmptyStateProps = {
  icon: ComponentProps<typeof Ionicons>["name"];
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionAccessibilityLabel?: string;
  compact?: boolean;
};

export function EmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
  actionAccessibilityLabel,
  compact = false,
}: EmptyStateProps) {
  return (
    <View
      className={
        compact
          ? "items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-8 dark:border-slate-700 dark:bg-slate-900"
          : "flex-1 items-center justify-center px-6 py-10"
      }
    >
      <Ionicons name={icon} size={compact ? 36 : 56} color="#2563eb" />
      <Text className="mt-4 text-center text-base font-semibold text-slate-700 dark:text-slate-200">
        {title}
      </Text>
      {subtitle ? (
        <Text className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
          {subtitle}
        </Text>
      ) : null}
      {onAction && actionLabel ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionAccessibilityLabel ?? actionLabel}
          accessibilityHint="Cria um novo item"
          onPress={onAction}
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

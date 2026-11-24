import { ActivityIndicator, Pressable, Text } from "react-native";

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
};

export function PrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ busy: loading, disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      className={`min-h-[56px] flex-row items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 ${
        isDisabled ? "opacity-60" : ""
      }`}
    >
      {loading ? <ActivityIndicator color="#ffffff" /> : null}
      <Text className="text-base font-semibold text-white">{label}</Text>
    </Pressable>
  );
}

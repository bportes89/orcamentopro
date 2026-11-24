import { Text, View } from "react-native";

type TooltipProps = {
  text: string;
};

export function Tooltip({ text }: TooltipProps) {
  return (
    <View className="relative mb-3 self-end rounded-xl bg-blue-600 px-3 py-2">
      <Text className="max-w-[240px] text-xs font-semibold text-white">
        {text}
      </Text>
      <View className="absolute -bottom-1 right-5 h-2 w-2 rotate-45 bg-blue-600" />
    </View>
  );
}

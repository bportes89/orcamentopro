import { ActivityIndicator, Text, View } from "react-native";

type LoadingScreenProps = {
  label?: string;
};

export function LoadingScreen({ label }: LoadingScreenProps = {}) {
  return (
    <View className="flex-1 items-center justify-center bg-white px-6 dark:bg-neutral-950">
      <ActivityIndicator size="large" color="#2563eb" />
      {label ? (
        <Text className="mt-4 text-sm text-neutral-500 dark:text-neutral-300">
          {label}
        </Text>
      ) : null}
    </View>
  );
}

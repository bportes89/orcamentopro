import { useEffect, useState } from "react";
import { Animated, Text, View } from "react-native";

export type ToastMessage = {
  id: number;
  text: string;
};

type ToastProps = {
  toast: ToastMessage | null;
  onHide: () => void;
};

export function Toast({ toast, onHide }: ToastProps) {
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!toast) {
      return;
    }

    opacity.setValue(0);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          onHide();
        }
      });
    }, 2200);

    return () => clearTimeout(timer);
  }, [toast, opacity, onHide]);

  if (!toast) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        bottom: 24,
        left: 24,
        right: 24,
        opacity,
      }}
    >
      <View className="rounded-xl bg-slate-900 px-4 py-3 dark:bg-slate-100">
        <Text className="text-center text-sm font-medium text-white dark:text-slate-900">
          {toast.text}
        </Text>
      </View>
    </Animated.View>
  );
}

import type { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { useSyncStatus, type SyncStatus } from "@/services/sync-status";

type IconName = ComponentProps<typeof Ionicons>["name"];

const CONFIG: Record<
  Exclude<SyncStatus, "idle">,
  { label: string; icon: IconName }
> = {
  syncing: { label: "Sinc.", icon: "sync-outline" },
  offline: { label: "Sem internet", icon: "cloud-offline-outline" },
  error: { label: "Erro na sincronia", icon: "alert-circle-outline" },
};

export function SyncBadge() {
  const status = useSyncStatus();

  if (status === "idle") {
    return null;
  }

  const config = CONFIG[status];

  return (
    <View className="flex-row items-center justify-center gap-1 rounded-full bg-slate-900 px-3 py-1">
      <Ionicons name={config.icon} size={11} color="#fff" />
      <Text className="text-[11px] font-medium text-white">{config.label}</Text>
    </View>
  );
}

import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useSyncStatus, type SyncStatus } from "@/services/sync-status";

type IndicatorConfig = {
  label: string;
  backgroundClass: string;
  icon: "sync-outline" | "cloud-offline-outline" | "alert-circle-outline";
};

const CONFIG: Record<Exclude<SyncStatus, "idle">, IndicatorConfig> = {
  syncing: {
    label: "Sincronizando...",
    backgroundClass: "bg-blue-600",
    icon: "sync-outline",
  },
  offline: {
    label: "Sem conexão — alterações salvas no aparelho",
    backgroundClass: "bg-slate-600",
    icon: "cloud-offline-outline",
  },
  error: {
    label: "Sincronização pendente — tentaremos novamente",
    backgroundClass: "bg-amber-600",
    icon: "alert-circle-outline",
  },
};

export function SyncIndicator() {
  const status = useSyncStatus();

  if (status === "idle") {
    return null;
  }

  const config = CONFIG[status];

  return (
    <View
      className={`flex-row items-center justify-center gap-1.5 px-4 py-1.5 ${config.backgroundClass}`}
    >
      <Ionicons name={config.icon} size={13} color="#ffffff" />
      <Text className="text-[11px] font-medium text-white">
        {config.label}
      </Text>
    </View>
  );
}

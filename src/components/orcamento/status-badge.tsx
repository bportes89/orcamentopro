import { Text } from "react-native";

import type { StatusOrcamento } from "@/types";

const STATUS_CONFIG: Record<
  StatusOrcamento,
  { label: string; className: string }
> = {
  rascunho: {
    label: "Rascunho",
    className:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  },
  enviado: {
    label: "Enviado",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  },
  aprovado: {
    label: "Aprovado",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  },
  recusado: {
    label: "Recusado",
    className:
      "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  },
};

export function StatusBadge({ status }: { status: StatusOrcamento }) {
  const config = STATUS_CONFIG[status];

  return (
    <Text
      className={`self-start rounded-full px-3 py-1 text-xs font-semibold ${config.className}`}
    >
      {config.label}
    </Text>
  );
}

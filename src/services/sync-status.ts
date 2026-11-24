import { create } from "zustand";

export const SYNC_STATUSES = ["idle", "syncing", "error", "offline"] as const;

export type SyncStatus = (typeof SYNC_STATUSES)[number];

type SyncStatusState = {
  status: SyncStatus;
  setStatus: (status: SyncStatus) => void;
};

export const useSyncStatusStore = create<SyncStatusState>((set) => ({
  status: "idle",
  setStatus: (status) => set({ status }),
}));

export function setSyncStatus(status: SyncStatus): void {
  useSyncStatusStore.setState({ status });
}

export function useSyncStatus(): SyncStatus {
  return useSyncStatusStore((state) => state.status);
}

"use client";

import { Check, Loader2, WifiOff } from "lucide-react";
import type { SyncStatus } from "@/offline/sync-provider";

const SYNC_CONFIG: Record<
  SyncStatus,
  { label: string; className: string; Icon: typeof Check }
> = {
  saved: { label: "Guardado", className: "text-gray-400", Icon: Check },
  syncing: { label: "Sincronizando...", className: "text-gray-400", Icon: Loader2 },
  synced: { label: "Sincronizado", className: "text-status-good", Icon: Check },
  offline: { label: "Sin conexión", className: "text-warning", Icon: WifiOff },
};

interface SyncIndicatorProps {
  status: SyncStatus;
}

export function SyncIndicator({ status }: SyncIndicatorProps) {
  const config = SYNC_CONFIG[status];
  const Icon = config.Icon;

  return (
    <span
      className={`flex items-center gap-1 text-xs ${config.className}`}
      aria-live="polite"
    >
      <Icon className={`h-3 w-3 ${status === "syncing" ? "animate-spin" : ""}`} />
      {config.label}
    </span>
  );
}

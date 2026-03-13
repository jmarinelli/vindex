"use client";

import { cn } from "@/lib/utils";
import type { FindingStatus } from "@/types/inspection";

const STATUS_CONFIG: Record<
  FindingStatus,
  { label: string; icon: string; bg: string; border: string; text: string }
> = {
  good: {
    label: "Bien",
    icon: "✓",
    bg: "bg-status-good-bg",
    border: "border-status-good",
    text: "text-status-good",
  },
  attention: {
    label: "Att",
    icon: "▲",
    bg: "bg-status-attention-bg",
    border: "border-status-attention",
    text: "text-status-attention",
  },
  critical: {
    label: "Crit",
    icon: "✕",
    bg: "bg-status-critical-bg",
    border: "border-status-critical",
    text: "text-status-critical",
  },
  not_evaluated: {
    label: "N/E",
    icon: "—",
    bg: "bg-status-not-evaluated-bg",
    border: "border-status-not-evaluated",
    text: "text-status-not-evaluated",
  },
};

const STATUS_ORDER: FindingStatus[] = [
  "good",
  "attention",
  "critical",
  "not_evaluated",
];

interface StatusButtonsProps {
  value: FindingStatus;
  onChange: (status: FindingStatus) => void;
}

export function StatusButtons({ value, onChange }: StatusButtonsProps) {
  return (
    <div className="grid grid-cols-4 gap-1.5" role="radiogroup" aria-label="Estado del item">
      {STATUS_ORDER.map((status) => {
        const config = STATUS_CONFIG[status];
        const isSelected = value === status;

        return (
          <button
            key={status}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => {
              // Toggle: tap selected → return to not_evaluated
              onChange(isSelected ? "not_evaluated" : status);
            }}
            className={cn(
              "h-14 flex items-center justify-center gap-1 text-sm rounded-sm border-2 transition-colors",
              isSelected
                ? `${config.bg} ${config.border} ${config.text} font-semibold`
                : "bg-white border-gray-200 text-gray-600"
            )}
          >
            <span>{config.icon}</span>
            <span>{config.label}</span>
          </button>
        );
      })}
    </div>
  );
}

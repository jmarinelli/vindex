"use client";

import { useState } from "react";
import {
  CircleCheck,
  TriangleAlert,
  CircleX,
  Slash,
  ChevronDown,
  ChevronRight,
  Pencil,
} from "lucide-react";
import type { InspectionFinding, EventPhoto } from "@/db/schema";
import type { TemplateSection } from "@/lib/validators";
import { PhotoThumbnail } from "./photo-thumbnail";

// ─── Status helpers ─────────────────────────────────────────────────────────

const statusConfig = {
  good: {
    icon: CircleCheck,
    color: "text-status-good",
    bg: "bg-status-good-bg",
    border: "bg-status-good",
    label: "Bien",
    symbol: "✓",
  },
  attention: {
    icon: TriangleAlert,
    color: "text-status-attention",
    bg: "bg-status-attention-bg",
    border: "bg-status-attention",
    label: "Atención",
    symbol: "⚠",
  },
  critical: {
    icon: CircleX,
    color: "text-status-critical",
    bg: "bg-status-critical-bg",
    border: "bg-status-critical",
    label: "Crítico",
    symbol: "✕",
  },
  not_applicable: {
    icon: Slash,
    color: "text-gray-500",
    bg: "bg-gray-100",
    border: "bg-gray-400",
    label: "N/A",
    symbol: "ø",
  },
} as const;

type EvaluatedStatus = keyof typeof statusConfig;

// ─── Section Component ──────────────────────────────────────────────────────

interface FindingsSectionProps {
  section: TemplateSection;
  findings: InspectionFinding[];
  photos: EventPhoto[];
  defaultExpanded: boolean;
  onPhotoClick: (photoUrl: string, allPhotos: EventPhoto[]) => void;
}

export function FindingsSection({
  section,
  findings,
  photos,
  defaultExpanded,
  onPhotoClick,
}: FindingsSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  // Build finding map for this section
  const findingMap = new Map<string, InspectionFinding>();
  for (const f of findings) {
    if (f.sectionId === section.id) {
      findingMap.set(f.itemId, f);
    }
  }

  // Build photo map: findingId -> photos
  const photoMap = new Map<string, EventPhoto[]>();
  for (const p of photos) {
    if (p.findingId) {
      const list = photoMap.get(p.findingId) || [];
      list.push(p);
      photoMap.set(p.findingId, list);
    }
  }

  // Count statuses for this section
  const counts: Record<EvaluatedStatus, number> = { good: 0, attention: 0, critical: 0, not_applicable: 0 };
  for (const item of section.items) {
    const finding = findingMap.get(item.id);
    if (finding?.status && finding.status in counts) {
      counts[finding.status as EvaluatedStatus]++;
    }
  }

  // Count photos for this section
  const sectionPhotoCount = section.items.reduce((acc, item) => {
    const finding = findingMap.get(item.id);
    if (finding) {
      return acc + (photoMap.get(finding.id)?.length || 0);
    }
    return acc;
  }, 0);

  const ChevronIcon = expanded ? ChevronDown : ChevronRight;

  return (
    <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
      {/* Section header — always visible, acts as toggle */}
      <button
        type="button"
        className="w-full flex flex-col gap-1 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        aria-controls={`section-body-${section.id}`}
      >
        <div className="flex items-center justify-between w-full">
          <span className="text-[15px] font-semibold text-gray-800">
            {section.name}
          </span>
          <div className="flex items-center gap-1.5">
            {(["good", "attention", "critical", "not_applicable"] as const).map((status) =>
              counts[status] > 0 ? (
                <span
                  key={status}
                  className={`${statusConfig[status].bg} ${statusConfig[status].color} text-[11px] font-semibold rounded-full px-2 py-0.5`}
                  aria-label={`${counts[status]} ${statusConfig[status].label}`}
                >
                  {statusConfig[status].symbol}
                  {counts[status]}
                </span>
              ) : null
            )}
            <ChevronIcon className="w-[18px] h-[18px] text-gray-400 transition-transform duration-150" />
          </div>
        </div>
        <span className="text-xs text-gray-400">
          {section.items.length} items · {sectionPhotoCount} fotos
        </span>
      </button>

      {/* Section body — collapsible */}
      <div
        id={`section-body-${section.id}`}
        className={`transition-all duration-200 ease-out overflow-hidden ${
          expanded ? "max-h-[9999px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="border-t border-gray-200">
          {section.items.map((item, idx) => {
            const finding = findingMap.get(item.id);
            const findingPhotos = finding ? photoMap.get(finding.id) || [] : [];
            const isLast = idx === section.items.length - 1;
            const status = finding?.status as EvaluatedStatus | "not_evaluated" | null | undefined;
            const isChecklist = item.type === "checklist_item";

            const config = status && status in statusConfig
              ? statusConfig[status as EvaluatedStatus]
              : null;

            return (
              <div
                key={item.id}
                className={`flex gap-3 px-4 py-3 ${!isLast ? "border-b border-gray-200" : ""}`}
              >
                {/* Status left border */}
                {config ? (
                  <div className={`w-[3px] rounded-sm ${config.border} shrink-0 self-stretch`} />
                ) : isChecklist ? (
                  <div className="w-[3px] shrink-0" />
                ) : null}

                <div className="flex flex-col gap-1 min-w-0 flex-1">
                  {/* Item name row */}
                  <div className="flex items-center gap-1.5">
                    {config ? (
                      <config.icon
                        className={`w-4 h-4 ${config.color} shrink-0`}
                        aria-label={`Estado: ${config.label}`}
                      />
                    ) : !isChecklist ? (
                      <Pencil
                        className="w-4 h-4 text-gray-500 shrink-0"
                        aria-label="Texto libre"
                      />
                    ) : null}
                    <span className="text-sm font-medium text-gray-800">
                      {item.name}
                    </span>
                  </div>

                  {/* Observation */}
                  {isChecklist && (
                    <p
                      className={`text-[13px] ${
                        finding?.observation
                          ? "text-gray-600"
                          : "text-gray-400 italic"
                      }`}
                    >
                      {finding?.observation || "Sin observaciones"}
                    </p>
                  )}
                  {!isChecklist && finding?.observation && (
                    <p className="text-[13px] text-gray-600">
                      {finding.observation}
                    </p>
                  )}

                  {/* Photos */}
                  {findingPhotos.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto mt-1">
                      {findingPhotos.map((photo) => (
                        <PhotoThumbnail
                          key={photo.id}
                          photo={photo}
                          alt={`${item.name} - foto`}
                          onClick={() => onPhotoClick(photo.url, findingPhotos)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

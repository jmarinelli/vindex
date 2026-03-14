"use client";

import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { TemplateSection } from "@/lib/validators";

interface SectionTabsProps {
  sections: TemplateSection[];
  activeIndex: number;
  onSelect: (index: number) => void;
  /** Map of sectionId → count of evaluated items */
  evaluatedCounts: Record<string, number>;
}

export function SectionTabs({
  sections,
  activeIndex,
  onSelect,
  evaluatedCounts,
}: SectionTabsProps) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Scroll active tab into view
  useEffect(() => {
    tabRefs.current[activeIndex]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeIndex]);

  return (
    <div
      className="h-11 border-b border-gray-200 bg-white overflow-x-auto flex shrink-0"
      role="tablist"
      style={{ scrollbarWidth: "none" }}
    >
      {sections.map((section, i) => {
        const isActive = i === activeIndex;
        const totalItems = section.items.length;
        const evaluatedCount = evaluatedCounts[section.id] ?? 0;
        const allEvaluated = totalItems > 0 && evaluatedCount >= totalItems;

        return (
          <button
            key={section.id}
            ref={(el) => { tabRefs.current[i] = el; }}
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(i)}
            className={cn(
              "h-11 px-4 text-sm whitespace-nowrap shrink-0 relative flex items-center gap-1.5",
              isActive
                ? "text-brand-accent font-medium"
                : "text-gray-500"
            )}
          >
            {section.name}
            {totalItems > 0 && (
              <span
                className={cn(
                  "text-[10px] tabular-nums",
                  allEvaluated
                    ? "font-semibold text-brand-accent"
                    : "text-gray-400"
                )}
              >
                {evaluatedCount}/{totalItems}
              </span>
            )}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-accent" />
            )}
          </button>
        );
      })}
    </div>
  );
}

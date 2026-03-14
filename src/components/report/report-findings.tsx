"use client";

import { useState, useCallback } from "react";
import type { InspectionFinding, EventPhoto } from "@/db/schema";
import type { TemplateSnapshot } from "@/types/inspection";
import { FindingsSection } from "./findings-section";
import { PhotoLightbox } from "./photo-lightbox";

interface ReportFindingsProps {
  templateSnapshot: TemplateSnapshot;
  findings: InspectionFinding[];
  photos: EventPhoto[];
}

export function ReportFindings({
  templateSnapshot,
  findings,
  photos,
}: ReportFindingsProps) {
  const [lightbox, setLightbox] = useState<{
    photos: EventPhoto[];
    currentIndex: number;
  } | null>(null);

  const handlePhotoClick = useCallback(
    (photoUrl: string, photoList: EventPhoto[]) => {
      const index = photoList.findIndex((p) => p.url === photoUrl);
      setLightbox({ photos: photoList, currentIndex: Math.max(0, index) });
    },
    []
  );

  // Determine if a section has critical items (for default expansion on mobile)
  const hasCritical = (sectionId: string) =>
    findings.some(
      (f) => f.sectionId === sectionId && f.status === "critical"
    );

  return (
    <>
      {templateSnapshot.sections.map((section) => (
        <FindingsSection
          key={section.id}
          section={section}
          findings={findings}
          photos={photos}
          defaultExpanded={hasCritical(section.id)}
          onPhotoClick={handlePhotoClick}
        />
      ))}

      {lightbox && (
        <PhotoLightbox
          photos={lightbox.photos}
          currentIndex={lightbox.currentIndex}
          onClose={() => setLightbox(null)}
          onNavigate={(index) =>
            setLightbox((prev) => (prev ? { ...prev, currentIndex: index } : null))
          }
        />
      )}
    </>
  );
}

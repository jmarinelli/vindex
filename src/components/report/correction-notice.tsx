import { Info } from "lucide-react";
import Link from "next/link";

interface CorrectionNoticeProps {
  type: "has_correction" | "is_correction";
  linkedSlug: string;
}

export function CorrectionNotice({ type, linkedSlug }: CorrectionNoticeProps) {
  return (
    <div className="bg-info/5 border border-gray-200 rounded-md p-4 flex items-start gap-3">
      <Info className="w-5 h-5 text-info shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex flex-col gap-1">
        <p className="text-sm text-info">
          {type === "has_correction"
            ? "Se ha emitido una corrección para este reporte."
            : "Este reporte corrige una inspección anterior."}
        </p>
        <Link
          href={`/report/${linkedSlug}`}
          className="text-sm font-medium text-brand-accent hover:underline"
        >
          {type === "has_correction" ? "Ver corrección →" : "Ver original →"}
        </Link>
      </div>
    </div>
  );
}

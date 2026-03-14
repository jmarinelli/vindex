import type { InspectionFinding, EventPhoto } from "@/db/schema";

interface SummaryCardProps {
  findings: InspectionFinding[];
  photos: EventPhoto[];
}

export function SummaryCard({ findings, photos }: SummaryCardProps) {
  const good = findings.filter((f) => f.status === "good").length;
  const attention = findings.filter((f) => f.status === "attention").length;
  const critical = findings.filter((f) => f.status === "critical").length;
  const total = findings.length;
  const photoCount = photos.length;

  const barTotal = good + attention + critical;

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-md p-4 flex flex-col gap-3">
      <h3 className="text-base font-semibold text-gray-800">Resumen</h3>

      {/* Segmented status bar */}
      <div
        className="w-full h-2 rounded-full overflow-hidden flex"
        role="img"
        aria-label={`${good} bien, ${attention} atención, ${critical} crítico`}
      >
        {barTotal > 0 && (
          <>
            {good > 0 && (
              <div
                className="bg-status-good h-full"
                style={{ width: `${(good / barTotal) * 100}%` }}
              />
            )}
            {attention > 0 && (
              <div
                className="bg-status-attention h-full"
                style={{ width: `${(attention / barTotal) * 100}%` }}
              />
            )}
            {critical > 0 && (
              <div
                className="bg-status-critical h-full"
                style={{ width: `${(critical / barTotal) * 100}%` }}
              />
            )}
          </>
        )}
      </div>

      {/* Status counts */}
      <div className="flex gap-2 flex-wrap">
        {good > 0 && (
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-status-good" />
            <span className="text-xs font-medium text-gray-700">
              {good} Bien
            </span>
          </div>
        )}
        {attention > 0 && (
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-status-attention" />
            <span className="text-xs font-medium text-gray-700">
              {attention} Atención
            </span>
          </div>
        )}
        {critical > 0 && (
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-status-critical" />
            <span className="text-xs font-medium text-gray-700">
              {critical} Crítico
            </span>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500">
        {total} items evaluados · {photoCount} fotos
      </p>
    </div>
  );
}

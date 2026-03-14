import type { NodeStats } from "@/lib/services/node";

interface StatsCardProps {
  stats: NodeStats;
}

const MONTH_NAMES = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

function formatOperatingSince(date: Date): string {
  const d = new Date(date);
  return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

function StatTile({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div
      className="flex flex-col items-center gap-1 bg-gray-50 rounded-lg p-3 sm:p-4"
      aria-label={`${value} ${label}`}
    >
      <span className="text-2xl sm:text-[28px] font-bold text-gray-800">
        {value}
      </span>
      <span className="text-[11px] sm:text-xs font-medium text-gray-500 text-center">
        {label}
      </span>
    </div>
  );
}

export function StatsCard({ stats }: StatsCardProps) {
  if (stats.inspectionCount === 0) return null;

  return (
    <div
      className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 sm:p-5 flex flex-col gap-3 sm:gap-4"
      data-testid="stats-card"
    >
      <h2 className="text-base font-semibold text-gray-800">Estadísticas</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatTile
          value={String(stats.inspectionCount)}
          label="inspecciones"
        />
        {stats.operatingSince && (
          <StatTile
            value={formatOperatingSince(stats.operatingSince)}
            label="inspeccionando desde"
          />
        )}
        <StatTile
          value={String(stats.avgPhotosPerReport)}
          label="fotos/reporte"
        />
        <StatTile
          value={String(stats.avgObservationsPerReport)}
          label="obs/reporte"
        />
        <StatTile
          value={String(stats.avgSectionsPerReport)}
          label="secciones/rep"
        />
      </div>
    </div>
  );
}

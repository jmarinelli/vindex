import type { NodeReviewStats } from "@/lib/services/review";
import { RatingDistributionBar } from "./rating-distribution-bar";

interface ReviewStatsProps {
  stats: NodeReviewStats;
}

export function ReviewStats({ stats }: ReviewStatsProps) {
  if (stats.total === 0) return null;

  return (
    <div
      className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 sm:p-5 flex flex-col gap-3 sm:gap-4"
      data-testid="review-stats"
    >
      <h2 className="text-base font-semibold text-gray-800">Reseñas</h2>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3">
        <div
          className="flex flex-col items-center gap-1 bg-gray-50 rounded-lg p-3 sm:p-4"
          aria-label={`${stats.total} reseñas`}
        >
          <span className="text-2xl sm:text-[28px] font-bold text-gray-800">
            {stats.total}
          </span>
          <span className="text-[11px] sm:text-xs font-medium text-gray-500 text-center">
            reseñas
          </span>
        </div>
        <div
          className="flex flex-col items-center gap-1 bg-gray-50 rounded-lg p-3 sm:p-4"
          aria-label={`${stats.matchRate}% coincidencia`}
        >
          <span className="text-2xl sm:text-[28px] font-bold text-gray-800">
            {stats.matchRate}%
          </span>
          <span className="text-[11px] sm:text-xs font-medium text-gray-500 text-center">
            coincidencia
          </span>
        </div>
      </div>

      {/* Distribution bar */}
      <RatingDistributionBar aggregation={stats} />
    </div>
  );
}

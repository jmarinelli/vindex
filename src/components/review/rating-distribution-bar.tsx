import type { ReviewAggregation } from "@/lib/services/review";

interface RatingDistributionBarProps {
  aggregation: ReviewAggregation;
}

export function RatingDistributionBar({
  aggregation,
}: RatingDistributionBarProps) {
  const { total, yesCount, partiallyCount, noCount } = aggregation;

  if (total === 0) return null;

  const yesPercent = (yesCount / total) * 100;
  const partiallyPercent = (partiallyCount / total) * 100;
  const noPercent = (noCount / total) * 100;

  return (
    <div className="flex flex-col gap-2" data-testid="rating-distribution-bar">
      {/* Segmented bar */}
      <div className="flex h-2 w-full overflow-hidden rounded-full">
        {yesPercent > 0 && (
          <div
            className="bg-emerald-500"
            style={{ width: `${yesPercent}%` }}
            aria-label={`${yesCount} sí`}
          />
        )}
        {partiallyPercent > 0 && (
          <div
            className="bg-amber-500"
            style={{ width: `${partiallyPercent}%` }}
            aria-label={`${partiallyCount} parcial`}
          />
        )}
        {noPercent > 0 && (
          <div
            className="bg-red-500"
            style={{ width: `${noPercent}%` }}
            aria-label={`${noCount} no`}
          />
        )}
      </div>

      {/* Count labels */}
      <div className="flex items-center gap-1 text-xs text-gray-600">
        <span className="text-emerald-600">✓ {yesCount} Sí</span>
        <span className="text-gray-400">·</span>
        <span className="text-amber-600">⚠ {partiallyCount} Parcial</span>
        <span className="text-gray-400">·</span>
        <span className="text-red-600">✕ {noCount} No</span>
        <span className="text-gray-400">·</span>
        <span className="text-gray-500">
          {total} {total === 1 ? "reseña" : "reseñas"}
        </span>
      </div>
    </div>
  );
}

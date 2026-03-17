import type { Review } from "@/db/schema";

interface ReviewSectionProps {
  review: Review | null;
}

const ratingConfig = {
  yes: { icon: "✓", label: "Sí, coincidió", className: "text-emerald-600" },
  partially: {
    icon: "⚠",
    label: "Parcialmente",
    className: "text-amber-600",
  },
  no: { icon: "✕", label: "No coincidió", className: "text-red-600" },
} as const;

export function ReviewSection({ review }: ReviewSectionProps) {
  if (!review) return null;

  const config = ratingConfig[review.matchRating];

  return (
    <div
      className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 sm:p-5 flex flex-col gap-3"
      data-testid="review-section"
    >
      <h2 className="text-base font-semibold text-gray-800">
        Reseña del comprador
      </h2>

      <div className="flex flex-col gap-1" data-testid="review-item">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${config.className}`}>
            {config.icon} {config.label}
          </span>
          <span className="text-xs text-gray-400">
            {new Date(review.createdAt).toLocaleDateString("es-AR")}
          </span>
        </div>
        {review.comment && (
          <p className="text-sm text-gray-700">{review.comment}</p>
        )}
      </div>
    </div>
  );
}

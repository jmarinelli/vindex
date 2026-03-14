import type { Review } from "@/db/schema";
import type { ReviewAggregation } from "@/lib/services/review";
import { ReviewForm } from "./review-form";
import { ReviewList } from "./review-list";
import { RatingDistributionBar } from "./rating-distribution-bar";

interface ReviewSectionProps {
  eventId: string;
  reviews: Review[];
  aggregation: ReviewAggregation;
}

export function ReviewSection({
  eventId,
  reviews,
  aggregation,
}: ReviewSectionProps) {
  const hasReviews = aggregation.total > 0;

  return (
    <div
      className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 sm:p-5 flex flex-col gap-4"
      data-testid="review-section"
    >
      <h2 className="text-base font-semibold text-gray-800">
        Dejar una reseña
      </h2>

      {!hasReviews && (
        <p className="text-sm text-gray-500">
          Sé el primero en dejar una reseña.
        </p>
      )}

      {/* Review form */}
      <ReviewForm eventId={eventId} />

      {/* Reviews display */}
      {hasReviews && (
        <div className="flex flex-col gap-4 border-t border-gray-100 pt-4">
          <RatingDistributionBar aggregation={aggregation} />
          <ReviewList reviews={reviews} />
        </div>
      )}
    </div>
  );
}

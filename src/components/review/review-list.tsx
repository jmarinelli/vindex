"use client";

import { useState } from "react";
import type { Review } from "@/db/schema";

interface ReviewListProps {
  reviews: Review[];
}

const INITIAL_VISIBLE = 5;

const ratingConfig = {
  yes: { icon: "✓", label: "Sí, coincidió", className: "text-emerald-600" },
  partially: {
    icon: "⚠",
    label: "Parcialmente",
    className: "text-amber-600",
  },
  no: { icon: "✕", label: "No coincidió", className: "text-red-600" },
} as const;

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffMins < 1) return "Hace un momento";
  if (diffMins < 60) return `Hace ${diffMins} ${diffMins === 1 ? "minuto" : "minutos"}`;
  if (diffHours < 24) return `Hace ${diffHours} ${diffHours === 1 ? "hora" : "horas"}`;
  if (diffDays < 7) return `Hace ${diffDays} ${diffDays === 1 ? "día" : "días"}`;
  if (diffWeeks < 5) return `Hace ${diffWeeks} ${diffWeeks === 1 ? "semana" : "semanas"}`;
  return `Hace ${diffMonths} ${diffMonths === 1 ? "mes" : "meses"}`;
}

function ReviewItem({ review }: { review: Review }) {
  const config = ratingConfig[review.matchRating];

  return (
    <div
      className="flex flex-col gap-1 border-b border-gray-100 pb-3 last:border-0 last:pb-0"
      data-testid="review-item"
    >
      <div className="flex items-center gap-2">
        <span className={`text-sm font-medium ${config.className}`}>
          {config.icon} {config.label}
        </span>
        <span className="text-xs text-gray-400">
          {formatRelativeTime(review.createdAt)}
        </span>
      </div>
      {review.comment && (
        <p className="text-sm text-gray-700">{review.comment}</p>
      )}
    </div>
  );
}

export function ReviewList({ reviews }: ReviewListProps) {
  const [showAll, setShowAll] = useState(false);

  if (reviews.length === 0) return null;

  const visible = showAll ? reviews : reviews.slice(0, INITIAL_VISIBLE);
  const hasMore = reviews.length > INITIAL_VISIBLE;

  return (
    <div className="flex flex-col gap-3" data-testid="review-list">
      {visible.map((review) => (
        <ReviewItem key={review.id} review={review} />
      ))}

      {hasMore && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="text-sm font-medium text-blue-600 hover:text-blue-700 text-left"
          data-testid="show-all-reviews"
        >
          Ver todas las reseñas ({reviews.length})
        </button>
      )}
    </div>
  );
}

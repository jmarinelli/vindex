"use client";

import { useState, useTransition } from "react";
import { submitReviewAction } from "@/lib/actions/review";
import { toast } from "sonner";

interface ReviewFormProps {
  eventId: string;
}

type MatchRating = "yes" | "partially" | "no";

const ratingOptions: Array<{
  value: MatchRating;
  label: string;
  icon: string;
  selectedBg: string;
  selectedBorder: string;
  selectedText: string;
}> = [
  {
    value: "yes",
    label: "Sí, coincidió",
    icon: "✓",
    selectedBg: "bg-emerald-50",
    selectedBorder: "border-emerald-500",
    selectedText: "text-emerald-700",
  },
  {
    value: "partially",
    label: "Parcialmente",
    icon: "⚠",
    selectedBg: "bg-amber-50",
    selectedBorder: "border-amber-500",
    selectedText: "text-amber-700",
  },
  {
    value: "no",
    label: "No coincidió",
    icon: "✕",
    selectedBg: "bg-red-50",
    selectedBorder: "border-red-500",
    selectedText: "text-red-700",
  },
];

export function ReviewForm({ eventId }: ReviewFormProps) {
  const [rating, setRating] = useState<MatchRating | null>(null);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (submitted) {
    return (
      <div
        className="flex flex-col items-center gap-2 py-6 text-center"
        data-testid="review-confirmation"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
          <span className="text-xl text-emerald-600">✓</span>
        </div>
        <h3 className="text-base font-semibold text-gray-800">
          ¡Gracias por tu reseña!
        </h3>
        <p className="text-sm text-gray-500">
          Tu opinión ayuda a otros compradores a tomar mejores decisiones.
        </p>
      </div>
    );
  }

  function handleSubmit() {
    if (!rating) return;

    startTransition(async () => {
      const result = await submitReviewAction({
        eventId,
        matchRating: rating,
        comment: comment || undefined,
      });

      if (result.success) {
        setSubmitted(true);
      } else {
        toast.error(result.error ?? "Error al enviar la reseña.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4" data-testid="review-form">
      {/* Question */}
      <p className="text-sm font-medium text-gray-700">
        ¿La condición real del vehículo coincidió con lo que describió el
        informe?
      </p>

      {/* Rating options */}
      <div className="flex flex-col gap-2" role="radiogroup" aria-label="Calificación de coincidencia">
        {ratingOptions.map((option) => {
          const isSelected = rating === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setRating(option.value)}
              className={`flex items-center gap-3 rounded-lg border-2 px-4 py-3 text-left text-sm font-medium transition-colors ${
                isSelected
                  ? `${option.selectedBg} ${option.selectedBorder} ${option.selectedText}`
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}
              data-testid={`rating-option-${option.value}`}
            >
              <span className="text-base">{option.icon}</span>
              {option.label}
            </button>
          );
        })}
      </div>

      {/* Comment */}
      <div className="flex flex-col gap-1">
        <label htmlFor="review-comment" className="text-sm text-gray-600">
          Comentario (opcional)
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => {
            if (e.target.value.length <= 500) setComment(e.target.value);
          }}
          placeholder="Contanos tu experiencia..."
          rows={2}
          className="resize-none rounded-lg border border-gray-200 px-3 py-2 text-base text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          data-testid="review-comment"
        />
        <span className="text-right text-xs text-gray-400">
          {comment.length}/500
        </span>
      </div>

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!rating || isPending}
        className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
        data-testid="review-submit"
      >
        {isPending ? "Enviando..." : "Enviar reseña"}
      </button>
    </div>
  );
}

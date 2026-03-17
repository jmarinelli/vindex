import { ShellPublic } from "@/components/layout/shell-public";
import { validateToken } from "@/lib/services/review-token";
import { ReviewPageForm } from "@/components/review/review-page-form";
import Link from "next/link";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await validateToken(token);

  if (result.status === "invalid") {
    return (
      <ShellPublic>
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <span className="text-2xl text-red-600">✕</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-800">
            Enlace inválido
          </h1>
          <p className="text-sm text-gray-500 max-w-sm">
            Este enlace de reseña no es válido. Verificá que el enlace sea
            correcto o contactá al inspector.
          </p>
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Ir al inicio
          </Link>
        </div>
      </ShellPublic>
    );
  }

  if (result.status === "expired") {
    return (
      <ShellPublic>
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <span className="text-2xl">⏱</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-800">
            Enlace expirado
          </h1>
          <p className="text-sm text-gray-500 max-w-sm">
            Este enlace de reseña expiró. Los enlaces tienen una validez de 90
            días.
          </p>
          {result.context && (
            <Link
              href={`/report/${result.context.reportSlug}`}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Ver reporte →
            </Link>
          )}
        </div>
      </ShellPublic>
    );
  }

  if (result.status === "used") {
    const review = result.existingReview;
    const ratingLabels: Record<string, { label: string; className: string }> = {
      yes: { label: "Sí, coincidió", className: "text-emerald-600" },
      partially: { label: "Parcialmente", className: "text-amber-600" },
      no: { label: "No coincidió", className: "text-red-600" },
    };
    const ratingInfo = review
      ? ratingLabels[review.matchRating]
      : null;

    return (
      <ShellPublic>
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <span className="text-2xl text-emerald-600">✓</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-800">
            Ya dejaste una reseña
          </h1>
          <p className="text-sm text-gray-500 max-w-sm">
            Gracias por tu opinión. Ya dejaste una reseña para esta verificación.
          </p>

          {review && (
            <div className="w-full max-w-sm bg-gray-50 border border-gray-200 rounded-lg p-4 text-left">
              {ratingInfo && (
                <p className={`text-sm font-medium ${ratingInfo.className}`}>
                  {ratingInfo.label}
                </p>
              )}
              {review.comment && (
                <p className="text-sm text-gray-700 mt-1">{review.comment}</p>
              )}
              <p className="text-xs text-gray-400 mt-2">
                {new Date(review.createdAt).toLocaleDateString("es-AR")}
              </p>
            </div>
          )}

          {result.context && (
            <Link
              href={`/report/${result.context.reportSlug}`}
              className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
            >
              Ver reporte completo
            </Link>
          )}
        </div>
      </ShellPublic>
    );
  }

  // Valid token — show review form
  return (
    <ShellPublic>
      <ReviewPageForm token={token} context={result.context!} />
    </ShellPublic>
  );
}

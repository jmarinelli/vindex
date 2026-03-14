import type { Metadata } from "next";
import { ShellPublic } from "@/components/layout/shell-public";
import { getPublicReport } from "@/lib/services/inspection";
import { VerificationBadge } from "@/components/report/verification-badge";
import { VehicleSummaryCard } from "@/components/report/vehicle-summary-card";
import { InspectorCard } from "@/components/report/inspector-card";
import { SummaryCard } from "@/components/report/summary-card";
import { ReportFindings } from "@/components/report/report-findings";
import { VehiclePhotos } from "@/components/report/vehicle-photos";
import { CorrectionNotice } from "@/components/report/correction-notice";
import { ReportNotFound } from "@/components/report/report-not-found";
import { ReviewSection } from "@/components/review/review-section";
import { CorrectionButton } from "@/components/report/correction-button";
import { getReviewsForEvent } from "@/lib/services/review";

// ─── OG Metadata ────────────────────────────────────────────────────────────

const inspectionTypeLabels: Record<string, string> = {
  pre_purchase: "pre-compra",
  intake: "recepción",
  periodic: "periódica",
  other: "inspección",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const report = await getPublicReport(slug);

  if (!report) {
    return { title: "Reporte no encontrado | VinDex" };
  }

  const { vehicle, node, findings, detail } = report;
  const vehicleName = [vehicle.make, vehicle.model, vehicle.year]
    .filter(Boolean)
    .join(" ");

  const good = findings.filter((f) => f.status === "good").length;
  const attention = findings.filter((f) => f.status === "attention").length;
  const critical = findings.filter((f) => f.status === "critical").length;

  const typeLabel = inspectionTypeLabels[detail.inspectionType] ?? "inspección";
  const description = `Inspección ${typeLabel} verificada. ${good} items bien, ${attention} atención, ${critical} crítico. Firmada por ${node.displayName}.`;

  const title = `Inspección — ${vehicleName} | VinDex`;
  const ogImageUrl = `/api/og/${slug}`;

  return {
    title,
    description,
    openGraph: {
      type: "article",
      title,
      description,
      images: [{ url: ogImageUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default async function ReportPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const report = await getPublicReport(slug);

  if (!report) {
    return (
      <ShellPublic>
        <ReportNotFound />
      </ShellPublic>
    );
  }

  const {
    event,
    vehicle,
    node,
    detail,
    signerName,
    findings,
    photos,
    templateSnapshot,
    correction,
    correctionOf,
  } = report;

  const reviewData = await getReviewsForEvent(event.id);

  return (
    <ShellPublic>
      <div className="flex flex-col gap-4">
        {/* Correction notices */}
        {correction && (
          <CorrectionNotice type="has_correction" linkedSlug={correction.slug} />
        )}
        {correctionOf && (
          <CorrectionNotice type="is_correction" linkedSlug={correctionOf.slug} />
        )}

        {/* Verification badge */}
        <VerificationBadge
          signedAt={event.signedAt!}
          signerName={signerName}
          nodeName={node.displayName}
        />

        {/* Vehicle summary */}
        <VehicleSummaryCard vehicle={vehicle} event={event} detail={detail} />

        {/* Vehicle photos gallery */}
        <VehiclePhotos
          photos={photos.filter((p) => p.photoType === "vehicle")}
        />

        {/* Inspector identity */}
        <InspectorCard node={node} />

        {/* Summary card */}
        <SummaryCard findings={findings} photos={photos} />

        {/* Findings by section + lightbox */}
        <ReportFindings
          templateSnapshot={templateSnapshot}
          findings={findings}
          photos={photos}
        />

        {/* Reviews */}
        <ReviewSection
          eventId={event.id}
          reviews={reviewData.reviews}
          aggregation={reviewData.aggregation}
        />

        {/* Correction button — only visible to authenticated node members */}
        <CorrectionButton eventId={event.id} nodeId={event.nodeId} />
      </div>
    </ShellPublic>
  );
}

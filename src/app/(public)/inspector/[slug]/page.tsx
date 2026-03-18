import type { Metadata } from "next";
import { ShellPublic } from "@/components/layout/shell-public";
import { auth } from "@/lib/auth";
import { getNodeProfile, getNodeStats, getSignedReports } from "@/lib/services/node";
import { IdentityCard } from "@/components/profile/identity-card";
import { StatsCard } from "@/components/profile/stats-card";
import { ReportList } from "@/components/profile/report-list";
import { ProfileNotFound } from "@/components/profile/profile-not-found";
import { ReviewStats } from "@/components/review/review-stats";
import { getReviewsForNode } from "@/lib/services/review";

// ─── OG Metadata ────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getNodeProfile(slug);

  if (!profile) {
    return { title: "Verificador no encontrado | VinDex" };
  }

  const { node } = profile;
  const title = `${node.displayName} — Verificador registrado | VinDex`;
  const description = node.bio
    ? `${node.bio.slice(0, 150)}${node.bio.length > 150 ? "..." : ""}`
    : `Perfil profesional de ${node.displayName}. Verificador registrado en VinDex.`;

  return {
    title,
    description,
    openGraph: {
      type: "profile",
      title,
      description,
    },
  };
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default async function InspectorProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = await getNodeProfile(slug);

  if (!profile) {
    return (
      <ShellPublic>
        <ProfileNotFound />
      </ShellPublic>
    );
  }

  const { node } = profile;

  const [session, stats, { reports, total }, reviewStats] = await Promise.all([
    auth(),
    getNodeStats(node.id),
    getSignedReports(node.id, 0, 10),
    getReviewsForNode(node.id),
  ]);

  const isOwner = session?.user?.nodeId === node.id;

  return (
    <ShellPublic>
      <div className="flex flex-col gap-4">
        <IdentityCard node={node} isOwner={isOwner} />
        <StatsCard stats={stats} />
        <ReviewStats stats={reviewStats} />
        <ReportList initialReports={reports} total={total} nodeId={node.id} />
      </div>
    </ShellPublic>
  );
}

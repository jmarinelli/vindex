"use client";

import { useEffect, useState } from "react";
import { getMetricsAction } from "@/lib/actions/admin";
import type { PlatformMetrics } from "@/lib/services/admin";

function MetricTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <div className="text-2xl font-bold text-gray-800">{value}</div>
      <div className="text-xs font-medium text-gray-500">{label}</div>
    </div>
  );
}

function MetricsSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
      <div className="h-5 w-48 bg-gray-200 rounded animate-pulse mb-4" />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-gray-50 rounded-lg p-3 h-[72px] animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export function MetricsTab() {
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadMetrics() {
    setLoading(true);
    setError(null);
    const result = await getMetricsAction();
    if (result.success && result.data) {
      setMetrics(result.data);
    } else {
      setError(result.error ?? "Error al cargar las métricas.");
    }
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loadMetrics is also used as onClick handler
    loadMetrics();
  }, []);

  if (loading) return <MetricsSkeleton />;

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
        <p className="text-gray-700 mb-3">Error al cargar datos.</p>
        <button
          onClick={loadMetrics}
          className="text-sm text-brand-accent hover:underline"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
      <h2 className="text-base font-semibold text-gray-800 mb-4">
        Métricas de la plataforma
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <MetricTile value={String(metrics.totalNodes)} label="nodos" />
        <MetricTile value={String(metrics.totalUsers)} label="usuarios" />
        <MetricTile
          value={String(metrics.totalInspections)}
          label="verificaciones"
        />
        <MetricTile
          value={String(metrics.signedInspections)}
          label="firmadas"
        />
        <MetricTile value={String(metrics.totalReviews)} label="reseñas" />
        <MetricTile
          value={metrics.matchRate !== null ? `${metrics.matchRate}%` : "—"}
          label="coincidencia"
        />
      </div>
    </div>
  );
}

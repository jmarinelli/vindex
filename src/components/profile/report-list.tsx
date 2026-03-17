"use client";

import { useState } from "react";
import { ClipboardList } from "lucide-react";
import type { SignedReportItem } from "@/lib/services/node";

interface ReportListProps {
  initialReports: SignedReportItem[];
  total: number;
  nodeId: string;
}

const inspectionTypeLabels: Record<string, string> = {
  pre_purchase: "Pre-compra",
  intake: "Recepción",
  periodic: "Periódica",
  other: "Inspección",
};

function formatDate(date: Date | string | null): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function ReportItem({ report }: { report: SignedReportItem }) {
  const { event, vehicle, detail } = report;

  const vehicleName =
    [vehicle.make, vehicle.model, vehicle.year]
      .filter(Boolean)
      .join(" ") || "Vehículo sin datos";

  const typeLabel =
    inspectionTypeLabels[detail.inspectionType] ?? "Inspección";

  return (
    <div className="bg-gray-50 rounded-md p-3 sm:p-4">
      <div className="flex flex-col gap-1.5 sm:gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm sm:text-[15px] font-semibold text-gray-800 truncate">
            {vehicleName}
          </span>
          <span className="text-xs sm:text-[13px] text-gray-500 shrink-0">
            {formatDate(event.signedAt)}
          </span>
        </div>

        <span className="text-xs sm:text-[13px] text-gray-500">
          {typeLabel}
        </span>
      </div>
    </div>
  );
}

export function ReportList({
  initialReports,
  total,
  nodeId,
}: ReportListProps) {
  const [reports, setReports] = useState(initialReports);
  const [loading, setLoading] = useState(false);
  const hasMore = reports.length < total;

  async function loadMore() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/inspector/${nodeId}/reports?offset=${reports.length}&limit=10`
      );
      if (res.ok) {
        const data = await res.json();
        setReports((prev) => [...prev, ...data.reports]);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 sm:p-5 flex flex-col gap-3 sm:gap-4"
      data-testid="reports-card"
    >
      <h2 className="text-base font-semibold text-gray-800">
        Inspecciones firmadas ({total})
      </h2>

      {total === 0 ? (
        <div className="flex flex-col items-center gap-3 py-8">
          <ClipboardList className="w-10 h-10 text-gray-300" aria-hidden="true" />
          <p className="text-sm text-gray-500 text-center">
            Este inspector aún no tiene inspecciones firmadas.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {reports.map((report, index) => (
            <div key={report.event.id}>
              <ReportItem report={report} />
              {index < reports.length - 1 && (
                <div className="h-px bg-gray-200 mt-3" />
              )}
            </div>
          ))}

          {hasMore && (
            <button
              onClick={loadMore}
              disabled={loading}
              className="text-sm font-medium text-brand-accent py-2 hover:underline disabled:opacity-50"
              aria-label="Cargar más inspecciones"
            >
              {loading ? "Cargando..." : "Ver más"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

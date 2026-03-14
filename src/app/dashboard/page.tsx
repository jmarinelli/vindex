"use client";

import { useEffect, useState } from "react";
import { ShellDashboard } from "@/components/layout/shell-dashboard";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Plus, Pencil, User, AlertTriangle } from "lucide-react";
import { InspectionList } from "@/components/inspection/inspection-list";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getInspectionsAction,
  getNodeSlugAction,
} from "@/lib/actions/inspection";
import type { InspectionListItem } from "@/lib/services/inspection";

export default function DashboardPage() {
  const { data: session } = useSession();
  const [inspections, setInspections] = useState<InspectionListItem[] | null>(
    null
  );
  const [nodeSlug, setNodeSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [inspResult, slugResult] = await Promise.all([
        getInspectionsAction(),
        getNodeSlugAction(),
      ]);

      if (!inspResult.success) {
        setError(inspResult.error ?? "Error al cargar las inspecciones.");
        return;
      }

      setInspections(inspResult.data ?? []);
      if (slugResult.success && slugResult.data) {
        setNodeSlug(slugResult.data);
      }
    }

    load();
  }, []);

  const firstName = session?.user?.name?.split(" ")[0] ?? "Inspector";

  return (
    <ShellDashboard>
      <div className="space-y-6">
        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-400" />
            <p className="mt-4 text-base text-gray-700">
              Error al cargar tus inspecciones.
            </p>
            <button
              onClick={() => {
                setError(null);
                setInspections(null);
                getInspectionsAction().then((r) => {
                  if (r.success) setInspections(r.data ?? []);
                  else setError(r.error ?? "Error al cargar.");
                });
              }}
              className="mt-3 px-4 py-2 text-sm bg-white border border-gray-200 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Loading State */}
        {!error && inspections === null && (
          <div className="space-y-6">
            <Skeleton className="h-8 w-52" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-10 w-full" />
            <div className="space-y-3">
              <Skeleton className="h-36 w-full" />
              <Skeleton className="h-36 w-full" />
              <Skeleton className="h-36 w-full" />
            </div>
          </div>
        )}

        {/* Loaded State */}
        {!error && inspections !== null && (
          <>
            {/* Welcome Header */}
            <h1 className="text-2xl sm:text-2xl font-bold text-gray-800">
              Bienvenido, {firstName}
            </h1>

            {/* New Inspection Button */}
            <Link
              href="/dashboard/inspect"
              className="flex items-center justify-center gap-2 w-full h-12 bg-blue-600 hover:bg-blue-700 text-white text-base font-medium rounded-md transition-colors"
            >
              <Plus className="h-5 w-5" />
              Nueva Inspección
            </Link>

            {/* Inspection List */}
            <InspectionList inspections={inspections} />

            {/* Quick Links */}
            <div className="pt-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs font-medium text-gray-400 uppercase">
                  Enlaces rápidos
                </span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/dashboard/template"
                  className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                >
                  <Pencil className="h-4 w-4" />
                  Editor de Template
                </Link>
                {nodeSlug && (
                  <Link
                    href={`/inspector/${nodeSlug}`}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    <User className="h-4 w-4" />
                    Mi Perfil Público
                  </Link>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </ShellDashboard>
  );
}

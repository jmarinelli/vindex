"use client";

import { ShellDashboard } from "@/components/layout/shell-dashboard";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function DashboardPage() {
  const { data: session } = useSession();

  return (
    <ShellDashboard>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Bienvenido, {session?.user?.name ?? "Inspector"}
          </h1>
          <p className="text-gray-500 mt-1">
            Panel de inspecciones
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/dashboard/inspect"
            className="block p-6 bg-white rounded-md border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
          >
            <h2 className="text-lg font-semibold text-gray-800">
              Nueva Inspección
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Iniciar una nueva inspección vehicular
            </p>
          </Link>

          <Link
            href="/dashboard/template"
            className="block p-6 bg-white rounded-md border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
          >
            <h2 className="text-lg font-semibold text-gray-800">
              Template
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Editar tu plantilla de inspección
            </p>
          </Link>
        </div>

        {/* Placeholder for inspection list */}
        <div className="bg-white rounded-md border border-gray-200 shadow-sm p-8 text-center">
          <p className="text-gray-400">
            Tus inspecciones aparecerán aquí
          </p>
        </div>
      </div>
    </ShellDashboard>
  );
}

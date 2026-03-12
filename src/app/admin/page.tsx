"use client";

import { ShellDashboard } from "@/components/layout/shell-dashboard";

export default function AdminPage() {
  return (
    <ShellDashboard>
      <div className="bg-white rounded-md border border-gray-200 shadow-sm p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Panel de Administración
        </h1>
        <p className="text-gray-400">
          El panel de admin se implementará en Phase 5
        </p>
      </div>
    </ShellDashboard>
  );
}

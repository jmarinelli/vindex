"use client";

import { useState } from "react";
import { ShellDashboard } from "@/components/layout/shell-dashboard";
import { MetricsTab } from "@/components/admin/metrics-tab";
import { NodesTab } from "@/components/admin/nodes-tab";
import { UsersTab } from "@/components/admin/users-tab";

type TabKey = "metricas" | "nodos" | "usuarios";

const tabs: { key: TabKey; label: string }[] = [
  { key: "metricas", label: "Métricas" },
  { key: "nodos", label: "Nodos" },
  { key: "usuarios", label: "Usuarios" },
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("metricas");

  return (
    <ShellDashboard title="Admin">
      {/* Tab bar */}
      <div className="border-b border-gray-200 bg-white -mx-4 px-4 mb-6">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 h-11 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "text-brand-accent border-b-2 border-brand-accent"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === "metricas" && <MetricsTab />}
      {activeTab === "nodos" && <NodesTab />}
      {activeTab === "usuarios" && <UsersTab />}
    </ShellDashboard>
  );
}

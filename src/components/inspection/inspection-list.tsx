"use client";

import { useState, useMemo, useCallback } from "react";
import { Search, X, ClipboardList } from "lucide-react";
import { InspectionCard } from "./inspection-card";
import type { InspectionListItem } from "@/lib/services/inspection";

type StatusFilter = "all" | "draft" | "signed";

const FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "draft", label: "Borrador" },
  { value: "signed", label: "Firmados" },
];

interface InspectionListProps {
  inspections: InspectionListItem[];
}

export function InspectionList({ inspections }: InspectionListProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filtered = useMemo(() => {
    let result = inspections;

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((i) => i.event.status === statusFilter);
    }

    // Search filter (debounce is handled at input level, filtering is instant)
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      result = result.filter((i) => {
        const vin = i.vehicle.vin?.toLowerCase() ?? "";
        const make = i.vehicle.make?.toLowerCase() ?? "";
        const model = i.vehicle.model?.toLowerCase() ?? "";
        const plate = i.vehicle.plate?.toLowerCase() ?? "";
        return (
          vin.includes(term) ||
          make.includes(term) ||
          model.includes(term) ||
          plate.includes(term)
        );
      });
    }

    return result;
  }, [inspections, search, statusFilter]);

  const clearFilters = useCallback(() => {
    setSearch("");
    setStatusFilter("all");
  }, []);

  // No inspections at all — hide search/filter
  if (inspections.length === 0) {
    return (
      <div className="text-center py-12" role="status">
        <ClipboardList className="mx-auto h-12 w-12 text-gray-300" />
        <h3 className="mt-4 text-lg font-medium text-gray-700">
          No tenés verificaciones
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Creá tu primera verificación para empezar.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por VIN, marca, modelo..."
            aria-label="Buscar verificaciones"
            className="w-full h-10 pl-9 pr-9 text-sm text-gray-800 placeholder:text-gray-400 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              aria-label="Limpiar búsqueda"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Status Filter Pills */}
        <div
          className="flex gap-2"
          role="radiogroup"
          aria-label="Filtrar por estado"
        >
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              role="radio"
              aria-checked={statusFilter === opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`h-8 px-3 text-xs font-medium rounded-full transition-colors ${
                statusFilter === opt.value
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Section Header */}
      <p className="text-base font-medium text-gray-700">
        Mis Verificaciones ({filtered.length})
      </p>

      {/* List or No Results */}
      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((item) => (
            <InspectionCard key={item.event.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12" role="status">
          <Search className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-4 text-sm text-gray-500">
            No se encontraron verificaciones con estos filtros.
          </p>
          <button
            onClick={clearFilters}
            className="mt-2 text-sm text-blue-600 hover:underline"
          >
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  );
}

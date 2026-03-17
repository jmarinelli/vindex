"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Info, AlertTriangle, Lock } from "lucide-react";
import { toast } from "sonner";
import { ShellDashboard } from "@/components/layout/shell-dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConnectivityMessage } from "@/components/offline/connectivity-message";
import { useOfflineStatus } from "@/offline/hooks";
import { validateVin, sanitizeVin, decodeVin } from "@/lib/vin";
import {
  lookupVehicleAction,
  findOrCreateVehicleAction,
} from "@/lib/actions/vehicle";

type VehicleMode = "idle" | "loading" | "mode-a" | "mode-b" | "mode-c";

interface FieldState {
  value: string;
  locked: boolean;
}

const emptyField = (): FieldState => ({ value: "", locked: false });

export default function InspectPage() {
  const router = useRouter();
  const isOnline = useOfflineStatus();

  const [vin, setVin] = useState("");
  const [vinError, setVinError] = useState<string | null>(null);
  const [vinValid, setVinValid] = useState(false);

  const [mode, setMode] = useState<VehicleMode>("idle");
  const [inspectionCount, setInspectionCount] = useState(0);

  const [make, setMake] = useState<FieldState>(emptyField());
  const [model, setModel] = useState<FieldState>(emptyField());
  const [year, setYear] = useState<FieldState>(emptyField());
  const [trim, setTrim] = useState<FieldState>(emptyField());

  const [plate, setPlate] = useState<FieldState>(emptyField());
  const [submitting, setSubmitting] = useState(false);

  const resetFields = useCallback(() => {
    setMode("idle");
    setInspectionCount(0);
    setMake(emptyField());
    setModel(emptyField());
    setYear(emptyField());
    setTrim(emptyField());
    setPlate(emptyField());
  }, []);

  const handleVinChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const sanitized = sanitizeVin(e.target.value);
      if (sanitized.length > 17) return;
      setVin(sanitized);
      setVinError(null);
      resetFields();

      if (sanitized.length < 17) {
        setVinValid(false);
        return;
      }

      const validation = validateVin(sanitized);
      if (!validation.valid) {
        setVinError(validation.error ?? null);
        setVinValid(false);
        return;
      }

      setVinValid(true);
      setMode("loading");

      const [dbResult, nhtsaResult] = await Promise.allSettled([
        lookupVehicleAction({ vin: sanitized }),
        decodeVin(sanitized),
      ]);

      const dbData =
        dbResult.status === "fulfilled" && dbResult.value.success
          ? dbResult.value.data
          : null;
      const decoded =
        nhtsaResult.status === "fulfilled" ? nhtsaResult.value : null;

      if (dbData?.vehicle) {
        // Mode A — existing vehicle
        const v = dbData.vehicle;
        setMode("mode-a");
        setInspectionCount(dbData.inspectionCount);
        setMake(
          v.make
            ? { value: v.make, locked: true }
            : { value: "", locked: false }
        );
        setModel(
          v.model
            ? { value: v.model, locked: true }
            : { value: "", locked: false }
        );
        setYear(
          v.year != null
            ? { value: String(v.year), locked: true }
            : { value: "", locked: false }
        );
        setTrim(
          v.trim
            ? { value: v.trim, locked: true }
            : { value: "", locked: false }
        );
        setPlate(
          v.plate
            ? { value: v.plate, locked: true }
            : { value: "", locked: false }
        );
      } else if (decoded && (decoded.make || decoded.model)) {
        // Mode B — new vehicle, NHTSA decoded
        setMode("mode-b");
        setMake({ value: decoded.make ?? "", locked: false });
        setModel({ value: decoded.model ?? "", locked: false });
        setYear({
          value: decoded.year != null ? String(decoded.year) : "",
          locked: false,
        });
        setTrim({ value: decoded.trim ?? "", locked: false });
      } else {
        // Mode C — new vehicle, decode failed
        setMode("mode-c");
      }
    },
    [resetFields]
  );

  const handleContinue = async () => {
    if (!vinValid) return;
    setSubmitting(true);

    const vehicleData = {
      vin,
      make: make.value || null,
      model: model.value || null,
      year: year.value ? parseInt(year.value, 10) : null,
      trim: trim.value || null,
      plate: plate.value,
    };

    const result = await findOrCreateVehicleAction(vehicleData);
    setSubmitting(false);

    if (!result.success) {
      toast.error(result.error ?? "Error al procesar el vehículo.");
      return;
    }

    sessionStorage.setItem(
      "vindex_inspect_vehicle",
      JSON.stringify(result.data!.vehicle)
    );
    sessionStorage.setItem(
      "vindex_inspect_inspectionCount",
      String(result.data!.inspectionCount)
    );

    router.push("/dashboard/inspect/metadata");
  };

  const showFields = mode === "mode-a" || mode === "mode-b" || mode === "mode-c";

  if (!isOnline) {
    return (
      <ShellDashboard title="Nueva Inspección">
        <div className="max-w-lg mx-auto">
          <Link
            href="/dashboard"
            className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-flex items-center gap-1"
          >
            ← Dashboard
          </Link>
          <p className="text-sm text-gray-500 mb-6">Paso 1 de 2 — Vehículo</p>
          <ConnectivityMessage
            title="Se requiere conexión"
            subtitle="La creación de inspecciones necesita conexión a internet para buscar vehículos."
          />
        </div>
      </ShellDashboard>
    );
  }

  return (
    <ShellDashboard title="Nueva Inspección">
      <div className="max-w-lg mx-auto">
        <Link
          href="/dashboard"
          className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-flex items-center gap-1"
        >
          ← Dashboard
        </Link>

        <p className="text-sm text-gray-500 mb-6">Paso 1 de 2 — Vehículo</p>

        {/* VIN Input */}
        <div className="mb-6">
          <label
            htmlFor="vin-input"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Número de VIN
          </label>
          <div className="relative">
            <Input
              id="vin-input"
              value={vin}
              onChange={handleVinChange}
              placeholder="Ingresá el VIN de 17 caracteres"
              className="h-10 text-lg font-mono uppercase"
              autoFocus
              autoComplete="off"
            />
            {mode === "loading" && (
              <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-400" />
            )}
          </div>

          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-500">
              {vin.length}/17 caracteres
            </span>
            {vinValid && !vinError && (
              <span className="text-xs text-status-good">✓ Válido</span>
            )}
          </div>

          {vinError && (
            <p className="text-xs text-error mt-1">{vinError}</p>
          )}

          {mode === "loading" && (
            <p className="text-sm text-gray-500 mt-2">Buscando VIN...</p>
          )}
        </div>

        {/* Mode A — Info Banner */}
        {mode === "mode-a" && inspectionCount > 0 && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800 flex items-center gap-2">
            <Info className="h-4 w-4 shrink-0" />
            Vehículo registrado — {inspectionCount} inspección(es).
          </div>
        )}

        {/* Mode C — Warning Banner */}
        {mode === "mode-c" && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-800 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            No se pudo decodificar el VIN. Podés ingresar los datos manualmente.
          </div>
        )}

        {/* Vehicle Data Fields — always visible after lookup */}
        {showFields && (
          <div className="mb-6">
            <div className="grid grid-cols-2 gap-3">
              <VehicleField
                id="vehicle-make"
                label="Marca"
                placeholder="Ej: Nissan"
                field={make}
                onChange={(v) => setMake({ ...make, value: v })}
              />
              <VehicleField
                id="vehicle-model"
                label="Modelo"
                placeholder="Ej: Sentra"
                field={model}
                onChange={(v) => setModel({ ...model, value: v })}
              />
              <VehicleField
                id="vehicle-year"
                label="Año"
                placeholder="Ej: 2019"
                field={year}
                type="number"
                onChange={(v) => setYear({ ...year, value: v })}
              />
              <VehicleField
                id="vehicle-trim"
                label="Versión"
                placeholder="Ej: SR"
                field={trim}
                onChange={(v) => setTrim({ ...trim, value: v })}
              />
            </div>
          </div>
        )}

        {/* Plate Input */}
        <div className="mb-6">
          <VehicleField
            id="plate-input"
            label="Patente"
            placeholder="Ej: AC123BD"
            field={plate}
            onChange={(v) => setPlate({ ...plate, value: v.toUpperCase() })}
          />
        </div>

        {/* Continue Button */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 sm:static sm:border-0 sm:bg-transparent sm:p-0">
          <Button
            onClick={handleContinue}
            disabled={!vinValid || !plate.value.trim() || submitting || mode === "loading"}
            className="w-full h-12 text-base"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Procesando...
              </>
            ) : (
              "Continuar"
            )}
          </Button>
        </div>

        <div className="h-20 sm:hidden" />
      </div>
    </ShellDashboard>
  );
}

function VehicleField({
  id,
  label,
  placeholder,
  field,
  type = "text",
  onChange,
}: {
  id: string;
  label: string;
  placeholder: string;
  field: FieldState;
  type?: "text" | "number";
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          type={type}
          value={field.value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.locked ? undefined : placeholder}
          readOnly={field.locked}
          className={
            field.locked
              ? "bg-gray-100 text-gray-500 cursor-not-allowed pr-8"
              : ""
          }
        />
        {field.locked && (
          <Lock className="absolute right-2.5 top-2.5 h-4 w-4 text-gray-400" />
        )}
      </div>
    </div>
  );
}

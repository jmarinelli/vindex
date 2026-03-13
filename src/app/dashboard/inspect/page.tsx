"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Car, Info } from "lucide-react";
import { toast } from "sonner";
import { ShellDashboard } from "@/components/layout/shell-dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { validateVin, sanitizeVin, decodeVin } from "@/lib/vin";
import { findOrCreateVehicleAction } from "@/lib/actions/vehicle";

interface VehicleInfo {
  id?: string;
  make: string | null;
  model: string | null;
  year: number | null;
  trim: string | null;
  inspectionCount?: number;
}

export default function InspectPage() {
  const router = useRouter();

  const [vin, setVin] = useState("");
  const [vinError, setVinError] = useState<string | null>(null);
  const [vinValid, setVinValid] = useState(false);

  const [decoding, setDecoding] = useState(false);
  const [decodeFailed, setDecodeFailed] = useState(false);
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo | null>(null);

  const [manualMake, setManualMake] = useState("");
  const [manualModel, setManualModel] = useState("");
  const [manualYear, setManualYear] = useState("");
  const [manualTrim, setManualTrim] = useState("");

  const [plate, setPlate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleVinChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const sanitized = sanitizeVin(e.target.value);
      if (sanitized.length > 17) return;
      setVin(sanitized);
      setVinError(null);
      setDecodeFailed(false);
      setVehicleInfo(null);

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

      setDecoding(true);
      const decoded = await decodeVin(sanitized);
      setDecoding(false);

      if (decoded && (decoded.make || decoded.model)) {
        setVehicleInfo(decoded);
      } else {
        setDecodeFailed(true);
      }
    },
    []
  );

  const handleContinue = async () => {
    if (!vinValid) return;
    setSubmitting(true);

    const vehicleData = decodeFailed
      ? {
          vin,
          make: manualMake || null,
          model: manualModel || null,
          year: manualYear ? parseInt(manualYear, 10) : null,
          trim: manualTrim || null,
          plate: plate || null,
        }
      : {
          vin,
          make: vehicleInfo?.make ?? null,
          model: vehicleInfo?.model ?? null,
          year: vehicleInfo?.year ?? null,
          trim: vehicleInfo?.trim ?? null,
          plate: plate || null,
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

  const vehicleName = vehicleInfo
    ? [vehicleInfo.make, vehicleInfo.model, vehicleInfo.year]
        .filter(Boolean)
        .join(" ")
    : null;

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
            {decoding && (
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

          {decoding && (
            <p className="text-sm text-gray-500 mt-2">Decodificando VIN...</p>
          )}
        </div>

        {/* Decoded Vehicle Card */}
        {vehicleInfo && !decodeFailed && (
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
            <div className="flex items-start gap-3">
              <Car className="h-6 w-6 text-gray-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-lg font-medium text-gray-800">
                  {vehicleName}
                  {vehicleInfo.trim ? ` — ${vehicleInfo.trim}` : ""}
                </p>
                <p className="text-sm text-gray-500 font-mono">{`VIN: ${vin}`}</p>
                {vehicleInfo.inspectionCount !== undefined &&
                  vehicleInfo.inspectionCount > 0 && (
                    <p className="text-sm text-info mt-1 flex items-center gap-1">
                      <Info className="h-3.5 w-3.5" />
                      {`Este vehículo ya tiene ${vehicleInfo.inspectionCount} inspección(es)`}
                    </p>
                  )}
              </div>
            </div>
          </div>
        )}

        {/* Decode Failure — Manual Entry */}
        {decodeFailed && (
          <div className="mb-6">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-800 mb-4">
              No se pudo decodificar el VIN. Podés ingresar los datos manualmente.
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
                <Input value={manualMake} onChange={(e) => setManualMake(e.target.value)} placeholder="Ej: Nissan" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
                <Input value={manualModel} onChange={(e) => setManualModel(e.target.value)} placeholder="Ej: Sentra" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
                <Input type="number" value={manualYear} onChange={(e) => setManualYear(e.target.value)} placeholder="Ej: 2019" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Versión</label>
                <Input value={manualTrim} onChange={(e) => setManualTrim(e.target.value)} placeholder="Ej: SR" />
              </div>
            </div>
          </div>
        )}

        {/* Plate Input */}
        <div className="mb-6">
          <label htmlFor="plate-input" className="block text-sm font-medium text-gray-700 mb-1">
            Patente (opcional)
          </label>
          <Input
            id="plate-input"
            value={plate}
            onChange={(e) => setPlate(e.target.value.toUpperCase())}
            placeholder="Ej: AC123BD"
            maxLength={20}
            className="uppercase"
          />
        </div>

        {/* Continue Button */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 sm:static sm:border-0 sm:bg-transparent sm:p-0">
          <Button
            onClick={handleContinue}
            disabled={!vinValid || submitting || decoding}
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

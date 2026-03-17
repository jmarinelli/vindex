"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ShellDashboard } from "@/components/layout/shell-dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConnectivityMessage } from "@/components/offline/connectivity-message";
import { useOfflineStatus } from "@/offline/hooks";
import { createInspectionAction } from "@/lib/actions/inspection";

interface VehicleData {
  id: string;
  vin: string;
  make: string | null;
  model: string | null;
  year: number | null;
  trim: string | null;
  plate: string | null;
}

const INSPECTION_TYPES = [
  { value: "pre_purchase", label: "Pre-compra" },
  { value: "intake", label: "Recepción" },
  { value: "periodic", label: "Periódica" },
  { value: "other", label: "Otra" },
] as const;

const REQUESTED_BY_OPTIONS = [
  { value: "buyer", label: "Comprador" },
  { value: "seller", label: "Vendedor" },
  { value: "agency", label: "Agencia" },
  { value: "other", label: "Otro" },
] as const;

export default function MetadataPage() {
  const router = useRouter();
  const isOnline = useOfflineStatus();

  const [vehicle, setVehicle] = useState<VehicleData | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [inspectionType, setInspectionType] = useState<string>("pre_purchase");
  const [requestedBy, setRequestedBy] = useState<string>("buyer");
  const [odometerKm, setOdometerKm] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("vindex_inspect_vehicle");
    if (stored) {
      setVehicle(JSON.parse(stored) as VehicleData);
    }
    setEventDate(new Date().toISOString().split("T")[0]);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded && !vehicle) {
      router.replace("/dashboard/inspect");
    }
  }, [loaded, vehicle, router]);

  const vehicleName = vehicle
    ? [vehicle.make, vehicle.model, vehicle.year].filter(Boolean).join(" ")
    : "";

  const handleSubmit = async () => {
    if (!vehicle) return;

    const km = parseInt(odometerKm, 10);
    if (!km || km <= 0) {
      toast.error("Ingresá un kilometraje válido.");
      return;
    }

    setSubmitting(true);

    const result = await createInspectionAction({
      vehicleId: vehicle.id,
      inspectionType,
      requestedBy,
      odometerKm: km,
      eventDate,
      customerEmail: customerEmail.trim() || undefined,
    });

    setSubmitting(false);

    if (!result.success) {
      toast.error(result.error ?? "Error al crear la inspección.");
      return;
    }

    // Store for field mode
    sessionStorage.setItem("vindex_inspect_eventId", result.data!.eventId);
    sessionStorage.setItem("vindex_inspect_vehicleName", vehicleName);

    // Clean up step 1 data
    sessionStorage.removeItem("vindex_inspect_vehicle");
    sessionStorage.removeItem("vindex_inspect_inspectionCount");

    router.push(`/dashboard/inspect/${result.data!.eventId}`);
  };

  if (!vehicle) return null;

  if (!isOnline) {
    return (
      <ShellDashboard title="Nueva Inspección">
        <div className="max-w-lg mx-auto">
          <Link
            href="/dashboard/inspect"
            className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-flex items-center gap-1"
          >
            ← Volver
          </Link>
          <p className="text-sm text-gray-500 mb-2">
            Paso 2 de 2 — Datos de inspección
          </p>
          <ConnectivityMessage
            title="Se requiere conexión"
            subtitle="La creación de inspecciones necesita conexión a internet."
          />
        </div>
      </ShellDashboard>
    );
  }

  return (
    <ShellDashboard title="Nueva Inspección">
      <div className="max-w-lg mx-auto">
        <Link
          href="/dashboard/inspect"
          className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-flex items-center gap-1"
        >
          ← Volver
        </Link>

        <p className="text-sm text-gray-500 mb-2">
          Paso 2 de 2 — Datos de inspección
        </p>

        {/* Vehicle summary */}
        <div className="mb-6 pb-4 border-b border-gray-200">
          <p className="text-lg font-medium text-gray-800">{vehicleName}</p>
          {vehicle.plate && (
            <p className="text-sm text-gray-500">Patente: {vehicle.plate}</p>
          )}
        </div>

        {/* Inspection Type */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de inspección
          </label>
          <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
            {INSPECTION_TYPES.map((opt, i) => (
              <label
                key={opt.value}
                className={`flex items-center h-14 px-4 cursor-pointer hover:bg-gray-50 ${
                  i < INSPECTION_TYPES.length - 1 ? "border-b border-gray-200" : ""
                }`}
              >
                <input
                  type="radio"
                  name="inspectionType"
                  value={opt.value}
                  checked={inspectionType === opt.value}
                  onChange={() => setInspectionType(opt.value)}
                  className="w-5 h-5 text-brand-accent border-gray-300 focus:ring-brand-accent"
                />
                <span
                  className={`ml-3 text-base ${
                    inspectionType === opt.value
                      ? "text-gray-800 font-medium"
                      : "text-gray-800"
                  }`}
                >
                  {opt.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Requested By */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Solicitada por
          </label>
          <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
            {REQUESTED_BY_OPTIONS.map((opt, i) => (
              <label
                key={opt.value}
                className={`flex items-center h-14 px-4 cursor-pointer hover:bg-gray-50 ${
                  i < REQUESTED_BY_OPTIONS.length - 1
                    ? "border-b border-gray-200"
                    : ""
                }`}
              >
                <input
                  type="radio"
                  name="requestedBy"
                  value={opt.value}
                  checked={requestedBy === opt.value}
                  onChange={() => setRequestedBy(opt.value)}
                  className="w-5 h-5 text-brand-accent border-gray-300 focus:ring-brand-accent"
                />
                <span
                  className={`ml-3 text-base ${
                    requestedBy === opt.value
                      ? "text-gray-800 font-medium"
                      : "text-gray-800"
                  }`}
                >
                  {opt.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Odometer */}
        <div className="mb-6">
          <label
            htmlFor="odometer-input"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Kilometraje
          </label>
          <div className="flex items-center gap-2">
            <Input
              id="odometer-input"
              type="number"
              inputMode="numeric"
              value={odometerKm}
              onChange={(e) => setOdometerKm(e.target.value)}
              placeholder="87500"
              className="h-12 text-lg font-medium text-right"
            />
            <span className="text-base text-gray-500">km</span>
          </div>
        </div>

        {/* Date */}
        <div className="mb-6">
          <label
            htmlFor="date-input"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Fecha de inspección
          </label>
          <Input
            id="date-input"
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className="h-10"
          />
        </div>

        {/* Customer Email */}
        <div className="mb-6">
          <label
            htmlFor="customer-email-input"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email del cliente (opcional)
          </label>
          <Input
            id="customer-email-input"
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            placeholder="comprador@email.com"
            className="h-10"
          />
          <p className="text-xs text-gray-500 mt-1">
            Se le enviará el informe y un enlace para dejar una reseña.
          </p>
        </div>

        {/* Start Button */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 sm:static sm:border-0 sm:bg-transparent sm:p-0">
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full h-12 text-base"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Creando...
              </>
            ) : (
              "Iniciar Inspección"
            )}
          </Button>
        </div>

        <div className="h-20 sm:hidden" />
      </div>
    </ShellDashboard>
  );
}

import { ShellPublic } from "@/components/layout/shell-public";

export default async function VehiclePage({
  params,
}: {
  params: Promise<{ vin: string }>;
}) {
  const { vin } = await params;

  return (
    <ShellPublic>
      <div className="bg-white rounded-md border border-gray-200 shadow-sm p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Historial del Vehículo
        </h1>
        <p className="text-sm text-gray-500 mb-4">VIN: {vin}</p>
        <p className="text-gray-400">
          La página del vehículo se implementará en Phase 5
        </p>
      </div>
    </ShellPublic>
  );
}

"use server";

import { auth } from "@/lib/auth";
import { lookupVehicleSchema, vehicleEntrySchema } from "@/lib/validators";
import * as vehicleService from "@/lib/services/vehicle";

type ActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

export async function lookupVehicleAction(
  input: unknown
): Promise<
  ActionResult<{
    vehicle: {
      id: string;
      vin: string;
      make: string | null;
      model: string | null;
      year: number | null;
      trim: string | null;
      plate: string;
    };
    inspectionCount: number;
  } | null>
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "No autenticado." };
  }

  const parsed = lookupVehicleSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Datos inválidos.";
    return { success: false, error: firstError };
  }

  try {
    const vehicle = await vehicleService.findVehicleByVin(parsed.data.vin);
    if (!vehicle) {
      return { success: true, data: null };
    }

    const inspectionCount = await vehicleService.countVehicleInspections(
      vehicle.id
    );

    return {
      success: true,
      data: {
        vehicle: {
          id: vehicle.id,
          vin: vehicle.vin,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          trim: vehicle.trim,
          plate: vehicle.plate,
        },
        inspectionCount,
      },
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al buscar el vehículo.";
    return { success: false, error: message };
  }
}

export async function findOrCreateVehicleAction(
  input: unknown
): Promise<
  ActionResult<{
    vehicle: {
      id: string;
      vin: string;
      make: string | null;
      model: string | null;
      year: number | null;
      trim: string | null;
      plate: string;
    };
    isNew: boolean;
    inspectionCount: number;
  }>
> {
  const session = await auth();
  if (!session?.user?.id || !session.user.nodeId) {
    return { success: false, error: "No autenticado." };
  }

  const parsed = vehicleEntrySchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Datos inválidos.";
    return { success: false, error: firstError };
  }

  try {
    const { vehicle, isNew } = await vehicleService.findOrCreateVehicle({
      ...parsed.data,
      nodeId: session.user.nodeId,
    });

    const inspectionCount = isNew
      ? 0
      : await vehicleService.countVehicleInspections(vehicle.id);

    return {
      success: true,
      data: {
        vehicle: {
          id: vehicle.id,
          vin: vehicle.vin,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          trim: vehicle.trim,
          plate: vehicle.plate,
        },
        isNew,
        inspectionCount,
      },
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al procesar el vehículo.";
    return { success: false, error: message };
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getVehicleEvents } from "@/lib/services/vehicle";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ vehicleId: string }> }
) {
  const { vehicleId } = await params;

  const searchParams = request.nextUrl.searchParams;
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "10", 10), 50);

  if (isNaN(offset) || isNaN(limit) || offset < 0 || limit < 1) {
    return NextResponse.json(
      { error: "Parámetros inválidos." },
      { status: 400 }
    );
  }

  const { events, total } = await getVehicleEvents(vehicleId, offset, limit);

  return NextResponse.json({ events, total });
}

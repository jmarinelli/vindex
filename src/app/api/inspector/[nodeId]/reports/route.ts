import { NextRequest, NextResponse } from "next/server";
import { getSignedReports } from "@/lib/services/node";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ nodeId: string }> }
) {
  const { nodeId } = await params;

  const searchParams = request.nextUrl.searchParams;
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "10", 10), 50);

  if (isNaN(offset) || isNaN(limit) || offset < 0 || limit < 1) {
    return NextResponse.json(
      { error: "Parámetros inválidos." },
      { status: 400 }
    );
  }

  const { reports, total } = await getSignedReports(nodeId, offset, limit);

  return NextResponse.json({ reports, total });
}

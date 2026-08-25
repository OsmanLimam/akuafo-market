import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { Supply } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supply = await db.supply.findFirst({
      where: { OR: [{ id }, { code: id }] },
      include: {
        supplier: {
          select: {
            id: true,
            code: true,
            name: true,
            type: true,
            region: true,
            district: true,
            town: true,
            verified: true,
            yearsOperating: true,
            completedOrders: true,
            fulfilmentRate: true,
            responseTimeHrs: true,
            imageUrl: true,
            lat: true,
            lon: true,
          },
        },
      },
    });
    if (!supply) return NextResponse.json({ error: "Supply not found" }, { status: 404 });
    return NextResponse.json({
      supply: {
        ...supply,
        harvestStart: supply.harvestStart?.toISOString() ?? null,
        harvestEnd: supply.harvestEnd?.toISOString() ?? null,
        createdAt: supply.createdAt.toISOString(),
      } satisfies Supply,
    });
  } catch (e) {
    console.error("GET /api/supplies/[id] failed", e);
    return NextResponse.json({ error: "Failed to load supply" }, { status: 500 });
  }
}

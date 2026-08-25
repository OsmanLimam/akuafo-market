import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supplier = await db.supplier.findFirst({
      where: { OR: [{ id }, { code: id }] },
      include: {
        supplies: {
          where: { available: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!supplier) return NextResponse.json({ error: "Supplier not found" }, { status: 404 });

    const activeOrders = await db.order.count({
      where: {
        supply: { supplierId: supplier.id },
        status: { in: ["REQUESTED", "CONFIRMED", "PREPARING", "READY", "IN_TRANSIT"] },
      },
    });

    return NextResponse.json({
      supplier: {
        ...supplier,
        createdAt: supplier.createdAt.toISOString(),
        supplies: supplier.supplies.map((s) => ({
          ...s,
          harvestStart: s.harvestStart?.toISOString() ?? null,
          harvestEnd: s.harvestEnd?.toISOString() ?? null,
          createdAt: s.createdAt.toISOString(),
          supplier: {
            id: supplier.id,
            code: supplier.code,
            name: supplier.name,
            type: supplier.type,
            region: supplier.region,
            district: supplier.district,
            town: supplier.town,
            verified: supplier.verified,
            yearsOperating: supplier.yearsOperating,
            completedOrders: supplier.completedOrders,
            fulfilmentRate: supplier.fulfilmentRate,
            responseTimeHrs: supplier.responseTimeHrs,
            imageUrl: supplier.imageUrl,
            lat: supplier.lat,
            lon: supplier.lon,
          },
        })),
        activeOrders,
      },
    });
  } catch (e) {
    console.error("GET /api/suppliers/[id] failed", e);
    return NextResponse.json({ error: "Failed to load supplier" }, { status: 500 });
  }
}

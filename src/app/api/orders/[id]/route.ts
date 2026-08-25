import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const order = await db.order.findFirst({
      where: { OR: [{ id }, { code: id }] },
      include: {
        supply: {
          select: {
            id: true,
            code: true,
            name: true,
            imageUrl: true,
            grade: true,
            pricePerKg: true,
            supplier: {
              select: {
                id: true,
                name: true,
                town: true,
                region: true,
                lat: true,
                lon: true,
                verified: true,
              },
            },
          },
        },
        events: { orderBy: { timestamp: "asc" } },
      },
    });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    return NextResponse.json({
      order: {
        ...order,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        events: order.events.map((e) => ({
          id: e.id,
          status: e.status,
          note: e.note,
          timestamp: e.timestamp.toISOString(),
        })),
      },
    });
  } catch (e) {
    console.error("GET /api/orders/[id] failed", e);
    return NextResponse.json({ error: "Failed to load order" }, { status: 500 });
  }
}

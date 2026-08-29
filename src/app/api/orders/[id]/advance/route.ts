import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, tokenFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

const JOURNEY = ["REQUESTED", "CONFIRMED", "PREPARING", "READY", "IN_TRANSIT", "DELIVERED"] as const;

const NOTES: Record<string, string> = {
  CONFIRMED: "Supplier confirmed availability and price",
  PREPARING: "Lot allocated, grading and packing under way",
  READY: "Order packed and awaiting dispatch",
  IN_TRANSIT: "Loaded and dispatched to destination",
  DELIVERED: "Delivered and receipted by buyer",
};

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Only a signed-in supplier who owns this order may advance it. Buyers
    // follow the timeline read-only; anonymous callers are rejected outright.
    const user = await getSessionUser(tokenFromRequest(req));
    if (!user)
      return NextResponse.json({ error: "Sign in to update this order" }, { status: 401 });

    const { id } = await params;
    const order = await db.order.findFirst({
      where: { OR: [{ id }, { code: id }] },
      include: { supply: { select: { supplierId: true } } },
    });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    if (!user.supplierId || order.supply.supplierId !== user.supplierId)
      return NextResponse.json(
        { error: "Only the supplier of this order can advance it" },
        { status: 403 },
      );

    const idx = JOURNEY.indexOf(order.status as (typeof JOURNEY)[number]);
    if (idx === -1 || idx >= JOURNEY.length - 1)
      return NextResponse.json({ error: "Order is already delivered" }, { status: 400 });

    const next = JOURNEY[idx + 1];

    const updated = await db.$transaction(async (tx) => {
      await tx.order.update({ where: { id: order.id }, data: { status: next } });
      await tx.orderEvent.create({
        data: { orderId: order.id, status: next, note: NOTES[next] },
      });
      return tx.order.findUnique({
        where: { id: order.id },
        include: {
          supply: {
            select: {
              id: true,
              code: true,
              name: true,
              imageUrl: true,
              grade: true,
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
    });

    // Bump supplier completed orders on delivery (best-effort)
    if (next === "DELIVERED" && updated) {
      await db.supplier
        .update({
          where: { id: updated.supply.supplier.id },
          data: { completedOrders: { increment: 1 } },
        })
        .catch(() => undefined);
    }

    return NextResponse.json({
      order: {
        ...updated!,
        createdAt: updated!.createdAt.toISOString(),
        updatedAt: updated!.updatedAt.toISOString(),
        events: updated!.events.map((e) => ({
          id: e.id,
          status: e.status,
          note: e.note,
          timestamp: e.timestamp.toISOString(),
        })),
      },
    });
  } catch (e) {
    console.error("POST /api/orders/[id]/advance failed", e);
    return NextResponse.json({ error: "Failed to advance order" }, { status: 500 });
  }
}

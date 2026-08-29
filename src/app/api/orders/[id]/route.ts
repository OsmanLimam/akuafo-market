import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, tokenFromRequest } from "@/lib/auth";
import { normalizeGhanaPhone } from "@/lib/phone";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(tokenFromRequest(req));
    if (!user)
      return NextResponse.json(
        { error: "Sign in to view this order" },
        { status: 401 },
      );

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
            supplierId: true,
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

    // Only the two parties of an order may read it — order codes are not a
    // secret, so membership is checked against the signed-in account.
    const isBuyer = order.buyerEmail.toLowerCase() === user.email.toLowerCase();
    const isSupplier = !!user.supplierId && order.supply.supplierId === user.supplierId;
    if (!isBuyer && !isSupplier)
      return NextResponse.json(
        { error: "This order belongs to a different account" },
        { status: 403 },
      );

    // Contact numbers for WhatsApp click-to-chat (both parties only).
    const [buyerUser, supplierUser] = await Promise.all([
      db.user.findUnique({ where: { email: order.buyerEmail }, select: { phone: true } }),
      db.user.findFirst({ where: { supplierId: order.supply.supplierId }, select: { phone: true } }),
    ]);

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
        contacts: {
          buyerPhone: normalizeGhanaPhone(buyerUser?.phone ?? "") ?? "",
          supplierPhone: normalizeGhanaPhone(supplierUser?.phone ?? "") ?? "",
        },
      },
    });
  } catch (e) {
    console.error("GET /api/orders/[id] failed", e);
    return NextResponse.json({ error: "Failed to load order" }, { status: 500 });
  }
}

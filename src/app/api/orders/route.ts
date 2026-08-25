import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, tokenFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

const orderInclude = {
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
} as const;

type OrderRow = {
  id: string;
  code: string;
  buyerName: string;
  buyerCompany: string;
  buyerEmail: string;
  quantityKg: number;
  unitPrice: number;
  productValue: number;
  deliveryFee: number;
  deliveryMethod: string;
  destination: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

function serialize(o: OrderRow) {
  return {
    ...o,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
  };
}

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(tokenFromRequest(req));
    if (!user)
      return NextResponse.json({ error: "Sign in to view your orders" }, { status: 401 });

    const role = req.nextUrl.searchParams.get("role") ?? "buyer";

    const orders =
      role === "supplier"
        ? user.supplierId
          ? await db.order.findMany({
              where: { supply: { supplierId: user.supplierId } },
              include: orderInclude,
              orderBy: { createdAt: "desc" },
            })
          : []
        : await db.order.findMany({
            where: { OR: [{ buyerEmail: user.email }] },
            include: orderInclude,
            orderBy: { createdAt: "desc" },
          });

    return NextResponse.json({ orders: orders.map(serialize) });
  } catch (e) {
    console.error("GET /api/orders failed", e);
    return NextResponse.json({ error: "Failed to load orders" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(tokenFromRequest(req));
    if (!user)
      return NextResponse.json(
        { error: "Sign in to request produce" },
        { status: 401 },
      );

    const body = await req.json();
    const supplyId = String(body.supplyId ?? "");
    const quantityKg = Math.round(Number(body.quantityKg ?? 0));
    const deliveryMethod = body.deliveryMethod === "PICKUP" ? "PICKUP" : "DELIVERY";
    const destination = String(body.destination ?? "").trim();
    const deliveryFee = deliveryMethod === "DELIVERY" ? Number(body.deliveryFee ?? 420) : 0;

    if (!supplyId) return NextResponse.json({ error: "Supply is required" }, { status: 400 });
    if (!Number.isFinite(quantityKg) || quantityKg <= 0)
      return NextResponse.json({ error: "Quantity must be a positive number" }, { status: 400 });
    if (!destination)
      return NextResponse.json({ error: "Destination is required" }, { status: 400 });

    const supply = await db.supply.findUnique({ where: { id: supplyId } });
    if (!supply || !supply.available)
      return NextResponse.json({ error: "This supply is no longer available" }, { status: 404 });
    if (quantityKg < supply.minOrderKg)
      return NextResponse.json(
        { error: `Minimum order for this lot is ${supply.minOrderKg} kg` },
        { status: 400 },
      );
    if (quantityKg > supply.quantityKg)
      return NextResponse.json(
        { error: `Only ${supply.quantityKg} kg remain available on this lot` },
        { status: 400 },
      );

    const count = await db.order.count();
    const code = `AKM-ORD-${1100 + count}`;
    const productValue = quantityKg * supply.pricePerKg;

    const order = await db.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          code,
          buyerName: user.name,
          buyerCompany: user.businessName || user.name,
          buyerEmail: user.email,
          supplyId: supply.id,
          quantityKg,
          unitPrice: supply.pricePerKg,
          productValue,
          deliveryFee,
          deliveryMethod,
          destination,
          status: "REQUESTED",
        },
      });
      await tx.orderEvent.create({
        data: {
          orderId: created.id,
          status: "REQUESTED",
          note: "Request submitted to supplier",
        },
      });
      // Reserve the quantity while the request is open
      await tx.supply.update({
        where: { id: supply.id },
        data: { quantityKg: { decrement: quantityKg } },
      });
      return created;
    });

    const full = await db.order.findUnique({ where: { id: order.id }, include: orderInclude });
    return NextResponse.json({ order: serialize(full!) }, { status: 201 });
  } catch (e) {
    console.error("POST /api/orders failed", e);
    return NextResponse.json({ error: "Failed to create request" }, { status: 500 });
  }
}

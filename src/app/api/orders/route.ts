import { NextRequest, NextResponse } from "next/server";
import { randomInt } from "crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getSessionUser, tokenFromRequest } from "@/lib/auth";
import { deliveryFeeFor } from "@/lib/delivery";

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
    // Server-authoritative pricing: the client-sent fee is never trusted.
    const deliveryFee = deliveryMethod === "DELIVERY" ? deliveryFeeFor(destination) : 0;

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

    const productValue = quantityKg * supply.pricePerKg;

    // Collision-safe order code: random 5-digit tail, retried on the rare
    // unique-constraint clash instead of a count()-based code that breaks
    // when two requests race.
    const createWithRetry = () =>
      db.$transaction(async (tx) => {
        const code = `AKM-ORD-${randomInt(10000, 100000)}`;
        // Atomic stock guard: the decrement only lands if enough kg remains.
        // This closes the race where two concurrent buyers oversell the lot.
        const guard = await tx.supply.updateMany({
          where: { id: supply.id, quantityKg: { gte: quantityKg } },
          data: { quantityKg: { decrement: quantityKg } },
        });
        if (guard.count === 0) throw new Error("SOLD_OUT");
        // Auto-close the lot once it is fully committed.
        const lot = await tx.supply.findUnique({
          where: { id: supply.id },
          select: { quantityKg: true },
        });
        if (lot && lot.quantityKg === 0) {
          await tx.supply.update({ where: { id: supply.id }, data: { available: false } });
        }
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
        return created;
      });

    let order;
    try {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          order = await createWithRetry();
          break;
        } catch (err) {
          if (
            err instanceof Prisma.PrismaClientKnownRequestError &&
            err.code === "P2002" &&
            attempt < 2
          )
            continue; // code collision, roll a new one
          throw err;
        }
      }
    } catch (err) {
      if (err instanceof Error && err.message === "SOLD_OUT") {
        const fresh = await db.supply.findUnique({ where: { id: supply.id } });
        return NextResponse.json(
          {
            error: `Only ${fresh?.quantityKg ?? 0} kg remain available on this lot`,
          },
          { status: 409 },
        );
      }
      throw err;
    }
    if (!order)
      return NextResponse.json({ error: "Failed to create request" }, { status: 500 });

    const full = await db.order.findUnique({ where: { id: order.id }, include: orderInclude });
    return NextResponse.json({ order: serialize(full!) }, { status: 201 });
  } catch (e) {
    console.error("POST /api/orders failed", e);
    return NextResponse.json({ error: "Failed to create request" }, { status: 500 });
  }
}

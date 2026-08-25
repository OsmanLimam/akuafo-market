import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, tokenFromRequest } from "@/lib/auth";
import type { Supply } from "@/lib/types";

export const dynamic = "force-dynamic";

function serialize(s: {
  id: string;
  code: string;
  name: string;
  category: string;
  quantityKg: number;
  totalQuantityKg: number;
  pricePerKg: number;
  grade: string;
  harvestStart: Date | null;
  harvestEnd: Date | null;
  description: string;
  imageUrl: string;
  available: boolean;
  deliveryAvailable: boolean;
  minOrderKg: number;
  createdAt: Date;
  supplier: {
    id: string;
    code: string;
    name: string;
    type: string;
    region: string;
    district: string;
    town: string;
    verified: boolean;
    yearsOperating: number;
    completedOrders: number;
    fulfilmentRate: number;
    responseTimeHrs: number;
    imageUrl: string | null;
    lat: number;
    lon: number;
  };
}): Supply {
  return {
    ...s,
    harvestStart: s.harvestStart ? s.harvestStart.toISOString() : null,
    harvestEnd: s.harvestEnd ? s.harvestEnd.toISOString() : null,
    createdAt: s.createdAt.toISOString(),
  };
}

const supplierInclude = {
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
} as const;

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const q = sp.get("q")?.trim() ?? "";
    const region = sp.get("region") ?? "";
    const category = sp.get("category") ?? "";
    const grade = sp.get("grade") ?? "";
    const minQty = Number(sp.get("minQty") ?? 0);
    const maxPrice = Number(sp.get("maxPrice") ?? 0);
    const deliveryOnly = sp.get("delivery") === "true";
    const verifiedOnly = sp.get("verified") === "true";
    const sort = sp.get("sort") ?? "relevance";

    const supplies = await db.supply.findMany({
      where: {
        available: true,
        ...(q && {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { code: { contains: q, mode: "insensitive" } },
            { supplier: { name: { contains: q, mode: "insensitive" } } },
          ],
        }),
        ...(region && { supplier: { region } }),
        ...(category && { category }),
        ...(grade && { grade }),
        ...(minQty > 0 && { quantityKg: { gte: minQty } }),
        ...(maxPrice > 0 && { pricePerKg: { lte: maxPrice } }),
        ...(deliveryOnly && { deliveryAvailable: true }),
        ...(verifiedOnly && { supplier: { verified: true } }),
      },
      include: supplierInclude,
      orderBy:
        sort === "price_asc"
          ? { pricePerKg: "asc" }
          : sort === "price_desc"
            ? { pricePerKg: "desc" }
            : sort === "qty_desc"
              ? { quantityKg: "desc" }
              : { createdAt: "desc" },
    });

    return NextResponse.json({ supplies: supplies.map(serialize) });
  } catch (e) {
    console.error("GET /api/supplies failed", e);
    return NextResponse.json({ error: "Failed to load supplies" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(tokenFromRequest(req));
    if (!user || user.role !== "SUPPLIER" || !user.supplierId) {
      return NextResponse.json(
        { error: "Sign in with a supplier account to list produce" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const name = String(body.name ?? "").trim();
    const category = String(body.category ?? "VEGETABLE");
    const quantityKg = Math.round(Number(body.quantityKg ?? 0));
    const pricePerKg = Number(body.pricePerKg ?? 0);
    const grade = String(body.grade ?? "GRADE_A");
    const harvestStart = body.harvestStart ? new Date(body.harvestStart) : null;
    const harvestEnd = body.harvestEnd ? new Date(body.harvestEnd) : null;
    const description = String(body.description ?? "").trim();
    const imageUrl = String(body.imageUrl ?? "/images/tomatoes.png");
    const minOrderKg = Math.max(50, Math.round(Number(body.minOrderKg ?? 100)));
    const deliveryAvailable = body.deliveryAvailable !== false;

    if (!name) return NextResponse.json({ error: "Commodity name is required" }, { status: 400 });
    if (!Number.isFinite(quantityKg) || quantityKg <= 0)
      return NextResponse.json({ error: "Quantity must be a positive number" }, { status: 400 });
    if (!Number.isFinite(pricePerKg) || pricePerKg <= 0)
      return NextResponse.json({ error: "Price must be a positive number" }, { status: 400 });

    const count = await db.supply.count();
    const code = `AKM-${20530 + count}`;

    const supply = await db.supply.create({
      data: {
        code,
        name,
        category,
        quantityKg,
        totalQuantityKg: quantityKg,
        pricePerKg,
        grade,
        harvestStart,
        harvestEnd,
        description: description || "Newly listed lot. Contact supplier for specification details.",
        imageUrl,
        minOrderKg,
        deliveryAvailable,
        supplierId: user.supplierId,
      },
      include: supplierInclude,
    });

    return NextResponse.json({ supply: serialize(supply) }, { status: 201 });
  } catch (e) {
    console.error("POST /api/supplies failed", e);
    return NextResponse.json({ error: "Failed to create listing" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, publicUser, tokenFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(tokenFromRequest(req));
    if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    let supplierCode: string | null = null;
    if (user.supplierId) {
      const supplier = await db.supplier.findUnique({ where: { id: user.supplierId } });
      supplierCode = supplier?.code ?? null;
    }
    return NextResponse.json({ user: publicUser({ ...user, supplierCode }) });
  } catch (e) {
    console.error("GET /api/auth/me failed", e);
    return NextResponse.json({ error: "Failed to load account" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getSessionUser(tokenFromRequest(req));
    if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const body = await req.json();
    const data: Record<string, string> = {};
    if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
    if (typeof body.businessName === "string") data.businessName = body.businessName.trim();
    if (typeof body.location === "string") data.location = body.location.trim();
    if (typeof body.phone === "string") data.phone = body.phone.trim();
    if (typeof body.interests === "string") data.interests = body.interests;

    const updated = await db.user.update({ where: { id: user.id }, data });

    let supplierCode: string | null = null;
    if (updated.supplierId) {
      const supplier = await db.supplier.findUnique({ where: { id: updated.supplierId } });
      supplierCode = supplier?.code ?? null;
      // Keep the supplier row name in sync with the business name
      if (supplier && data.businessName) {
        await db.supplier.update({ where: { id: supplier.id }, data: { name: data.businessName } });
      }
    }

    return NextResponse.json({ user: publicUser({ ...updated, supplierCode }) });
  } catch (e) {
    console.error("PATCH /api/auth/me failed", e);
    return NextResponse.json({ error: "Couldn't save your profile" }, { status: 500 });
  }
}

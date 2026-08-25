import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession, publicUser, verifyPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    const user = await db.user.findUnique({ where: { email } });
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: "Incorrect email or password" }, { status: 401 });
    }

    let supplierCode: string | null = null;
    if (user.supplierId) {
      const supplier = await db.supplier.findUnique({ where: { id: user.supplierId } });
      supplierCode = supplier?.code ?? null;
    }

    const token = await createSession(user.id);
    return NextResponse.json({ user: publicUser({ ...user, supplierCode }), token });
  } catch (e) {
    console.error("POST /api/auth/signin failed", e);
    return NextResponse.json({ error: "Couldn't sign you in. Try again." }, { status: 500 });
  }
}

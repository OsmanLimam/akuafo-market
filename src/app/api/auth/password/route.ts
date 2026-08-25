import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, hashPassword, tokenFromRequest, verifyPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(tokenFromRequest(req));
    if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const body = await req.json();
    const currentPassword = String(body.currentPassword ?? "");
    const newPassword = String(body.newPassword ?? "");

    if (newPassword.length < 8)
      return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });

    const full = await db.user.findUnique({ where: { id: user.id } });
    if (!full || !verifyPassword(currentPassword, full.passwordHash)) {
      return NextResponse.json({ error: "Your current password is incorrect" }, { status: 400 });
    }

    await db.user.update({ where: { id: user.id }, data: { passwordHash: hashPassword(newPassword) } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST /api/auth/password failed", e);
    return NextResponse.json({ error: "Couldn't change your password" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = String(body.token ?? "");
    const password = String(body.password ?? "");

    if (password.length < 8)
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });

    const reset = await db.passwordReset.findUnique({ where: { token } });
    if (!reset || reset.used || reset.expiresAt < new Date()) {
      return NextResponse.json({ error: "This reset link is invalid or has expired" }, { status: 400 });
    }

    await db.$transaction([
      db.user.update({ where: { id: reset.userId }, data: { passwordHash: hashPassword(password) } }),
      db.passwordReset.update({ where: { id: reset.id }, data: { used: true } }),
      db.session.deleteMany({ where: { userId: reset.userId } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST /api/auth/reset failed", e);
    return NextResponse.json({ error: "Couldn't reset your password. Try again." }, { status: 500 });
  }
}

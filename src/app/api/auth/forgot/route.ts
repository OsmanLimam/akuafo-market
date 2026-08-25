import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createResetToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email ?? "").trim().toLowerCase();

    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      // Same response either way, don't reveal which emails exist
      return NextResponse.json({ ok: true });
    }

    const token = await createResetToken(user.id);
    /* Prototype note: no email infrastructure exists, so the reset token is
       returned directly. In production this would be emailed as a link. */
    return NextResponse.json({ ok: true, resetToken: token });
  } catch (e) {
    console.error("POST /api/auth/forgot failed", e);
    return NextResponse.json({ error: "Something went wrong. Try again." }, { status: 500 });
  }
}

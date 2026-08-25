import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tokenFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const token = tokenFromRequest(req);
    if (token) {
      await db.session.deleteMany({ where: { token } });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST /api/auth/signout failed", e);
    return NextResponse.json({ error: "Sign out failed" }, { status: 500 });
  }
}

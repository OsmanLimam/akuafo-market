import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession, hashPassword, isValidEmail, publicUser } from "@/lib/auth";
import { normalizeGhanaPhone } from "@/lib/phone";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const name = String(body.name ?? "").trim();
    const role = body.role === "SUPPLIER" ? "SUPPLIER" : "BUYER";
    const businessName = String(body.businessName ?? "").trim();
    const location = String(body.location ?? "").trim();
    const interests = Array.isArray(body.interests) ? body.interests.join(",") : String(body.interests ?? "");

    if (!isValidEmail(email))
      return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
    if (password.length < 8)
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    if (!name) return NextResponse.json({ error: "Enter your name" }, { status: 400 });

    // Phone is required — in this market the phone number IS the business
    // line (delivery, WhatsApp, MoMo all hang off it).
    const phoneDigits = normalizeGhanaPhone(String(body.phone ?? ""));
    if (!phoneDigits)
      return NextResponse.json(
        { error: "Enter a valid Ghana phone number, e.g. 020 123 4567 or +233 20 123 4567" },
        { status: 400 },
      );
    const phone = `+${phoneDigits.slice(0, 3)} ${phoneDigits.slice(3, 6)} ${phoneDigits.slice(6)}`;

    const existing = await db.user.findUnique({ where: { email } });
    if (existing)
      return NextResponse.json(
        { error: "An account with this email already exists. Try signing in instead." },
        { status: 409 },
      );

    let supplierId: string | null = null;
    let supplierCode: string | null = null;

    if (role === "SUPPLIER") {
      const count = await db.supplier.count();
      const code = `SUP-${1300 + count}`;
      const region =
        ["Ashanti", "Bono East", "Ahafo", "Eastern", "Volta", "Central", "Greater Accra", "Western", "Northern", "North East", "Upper East", "Upper West"].find(
          (r) => location.toLowerCase().includes(r.toLowerCase()),
        ) ?? "Ashanti";
      const town = location.split(",")[0]?.trim() || "Kumasi";
      const supplier = await db.supplier.create({
        data: {
          code,
          name: businessName || `${name}'s Farm`,
          type: "FARM",
          region,
          district: "",
          town,
          verified: false,
          yearsOperating: 0,
          completedOrders: 0,
          fulfilmentRate: 0,
          responseTimeHrs: 24,
          description: "",
          lat: 6.69,
          lon: -1.62,
        },
      });
      supplierId = supplier.id;
      supplierCode = supplier.code;
    }

    const user = await db.user.create({
      data: {
        email,
        passwordHash: hashPassword(password),
        name,
        role,
        businessName,
        location,
        phone,
        interests,
        supplierId,
      },
    });

    const token = await createSession(user.id);
    return NextResponse.json(
      { user: publicUser({ ...user, supplierCode }), token },
      { status: 201 },
    );
  } catch (e) {
    console.error("POST /api/auth/signup failed", e);
    return NextResponse.json({ error: "Couldn't create your account. Try again." }, { status: 500 });
  }
}

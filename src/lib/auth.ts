import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { db } from "./db";

/* ── Password hashing (scrypt, no external deps) ─────────────────────── */

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const test = scryptSync(password, salt, 64);
  const original = Buffer.from(hash, "hex");
  return original.length === test.length && timingSafeEqual(original, test);
}

/* ── Sessions ─────────────────────────────────────────────────────────── */

const SESSION_DAYS = 30;

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000);
  await db.session.create({ data: { token, userId, expiresAt } });
  return token;
}

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  businessName: string;
  location: string;
  phone: string;
  interests: string;
  supplierId: string | null;
};

export async function getSessionUser(token: string | null): Promise<SessionUser | null> {
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
    businessName: session.user.businessName,
    location: session.user.location,
    phone: session.user.phone,
    interests: session.user.interests,
    supplierId: session.user.supplierId,
  };
}

export function tokenFromRequest(req: Request): string | null {
  const auth = req.headers.get("authorization") ?? "";
  return auth.startsWith("Bearer ") ? auth.slice(7) : null;
}

/* ── Password resets ──────────────────────────────────────────────────── */

export async function createResetToken(userId: string): Promise<string> {
  const token = randomBytes(20).toString("hex");
  const expiresAt = new Date(Date.now() + 3600000); // 1 hour
  await db.passwordReset.create({ data: { token, userId, expiresAt } });
  return token;
}

/* ── Validation helpers ───────────────────────────────────────────────── */

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function publicUser(u: SessionUser & { supplierCode?: string | null }) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    businessName: u.businessName,
    location: u.location,
    phone: u.phone,
    interests: u.interests,
    supplierId: u.supplierId,
    ...(u.supplierCode !== undefined ? { supplierCode: u.supplierCode ?? null } : {}),
  };
}

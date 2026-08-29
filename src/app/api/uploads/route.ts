import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { getSessionUser, tokenFromRequest } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ── Listing photo upload ───────────────────────────────────────────────────
   Accepts one image file (camera or gallery), normalises it to a max-1400px
   WebP and returns a URL the client stores on the listing.

   Storage strategy:
   • If BLOB_READ_WRITE_TOKEN is configured → upload to Vercel Blob (CDN URL).
   • Otherwise → fall back to an inline data URL persisted in the listing row
     (works with zero configuration; swap in Blob by adding the env var).   */

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const MAX_DIMENSION = 1400;

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(tokenFromRequest(req));
    if (!user || user.role !== "SUPPLIER") {
      return NextResponse.json(
        { error: "Sign in with a supplier account to upload photos" },
        { status: 401 },
      );
    }

    const form = await req.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No image file received" }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are supported" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Image must be smaller than 8 MB" }, { status: 413 });
    }

    const input = Buffer.from(await file.arrayBuffer());
    const webp = await sharp(input)
      .rotate() // honour EXIF orientation
      .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 74 })
      .toBuffer();

    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    if (blobToken) {
      try {
        const { put } = await import("@vercel/blob");
        const blob = await put(
          `listings/${user.id}-${Date.now()}.webp`,
          webp,
          { token: blobToken, access: "public", contentType: "image/webp" },
        );
        return NextResponse.json({ url: blob.url, storage: "blob" });
      } catch (blobErr) {
        console.error("Blob upload failed, falling back to inline", blobErr);
      }
    }

    // Zero-config fallback: inline WebP data URL (~30–90 KB after compression).
    const url = `data:image/webp;base64,${webp.toString("base64")}`;
    return NextResponse.json({ url, storage: "inline" });
  } catch (e) {
    console.error("POST /api/uploads failed", e);
    return NextResponse.json({ error: "Failed to process the image" }, { status: 500 });
  }
}

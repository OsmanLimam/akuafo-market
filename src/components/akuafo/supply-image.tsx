"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

/* ── SupplyImage ────────────────────────────────────────────────────────────
   Listing photos may be local presets (/images/*.png), Vercel Blob URLs, or
   inline data URLs (zero-config upload fallback). next/image cannot handle
   data URLs, so this helper renders a plain <img> for those while keeping
   next/image optimisation everywhere else.                              */

function isPlainImg(src: string): boolean {
  return src.startsWith("data:") || src.startsWith("blob:");
}

export function SupplyImage({
  src,
  alt,
  fill,
  sizes,
  width,
  height,
  className,
  priority,
}: {
  src: string;
  alt: string;
  fill?: boolean;
  sizes?: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}) {
  if (isPlainImg(src)) {
    return (
      <img
        src={src}
        alt={alt}
        className={cn(
          fill ? "absolute inset-0 h-full w-full" : undefined,
          "object-cover",
          className,
        )}
      />
    );
  }

  if (fill) {
    return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={cn("object-cover", className)} />;
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width ?? 800}
      height={height ?? 600}
      priority={priority}
      className={cn("object-cover", className)}
    />
  );
}

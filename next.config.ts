import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.public.blob.vercel-storage.com" },
    ],
  },
  async rewrites() {
    // SPA deep links: any path that does not match a real route (API, /_next,
    // /images, /favicon.ico are filesystem routes and win) serves the app.
    // The client store resolves /market, /lot/AKM-20500, /orders/AKM-ORD-…,
    // /supplier/SUP-1042, /sell, /signin, /dashboard/buyer etc.
    return [{ source: "/:path*", destination: "/" }];
  },
};

export default nextConfig;

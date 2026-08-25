import type { Metadata } from "next";
import "@fontsource-variable/fraunces";
import "@fontsource-variable/fraunces/wght-italic.css";
import "@fontsource-variable/dm-sans";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/ibm-plex-mono/600.css";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Akuafo Market: Source produce with confidence",
  description:
    "Find available agricultural produce from suppliers across Ghana. Compare prices, quantities and verified supply, then request and track your order from farm to buyer.",
  keywords: [
    "Akuafo Market",
    "agricultural marketplace",
    "B2B sourcing",
    "Ghana agriculture",
    "wholesale produce",
    "farm to buyer",
  ],
  authors: [{ name: "Osman Limam" }],
  openGraph: {
    title: "Akuafo Market: Source produce with confidence",
    description:
      "Find available agricultural produce from suppliers across Ghana. Compare prices, quantities and verified supply.",
    siteName: "Akuafo Market",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="font-sans antialiased bg-background text-foreground"
        style={
          {
            "--font-fraunces": "'Fraunces Variable', Georgia, 'Times New Roman', serif",
            "--font-dm-sans": "'DM Sans Variable', 'DM Sans', system-ui, sans-serif",
            "--font-plex-mono": "'IBM Plex Mono', ui-monospace, 'SF Mono', monospace",
          } as React.CSSProperties
        }
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}

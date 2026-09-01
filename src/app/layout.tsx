import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SuperPricePilot — Agentic Price Discovery",
  description: "A WebMCP-enabled marketplace where people and agents discover fairer prices together.",
  applicationName: "SuperPricePilot",
  metadataBase: new URL(process.env.RENDER_EXTERNAL_URL ?? "http://localhost:3000"),
  appleWebApp: {
    capable: true,
    title: "SuperPricePilot",
    statusBarStyle: "black-translucent"
  },
  openGraph: {
    title: "SuperPricePilot — Agentic Price Discovery",
    description: "Discover, negotiate, group-buy, and subscribe to fair laptop prices with WebMCP.",
    type: "website"
  }
};

export const viewport: Viewport = {
  themeColor: "#132238"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

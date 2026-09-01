import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LightningPricePilot — Agentic Price Discovery",
  description: "A WebMCP-enabled marketplace where people and agents discover fairer prices together.",
  applicationName: "LightningPricePilot",
  metadataBase: new URL(process.env.RENDER_EXTERNAL_URL ?? "http://localhost:3000"),
  appleWebApp: {
    capable: true,
    title: "LightningPricePilot",
    statusBarStyle: "black-translucent"
  },
  openGraph: {
    title: "LightningPricePilot — Agentic Price Discovery",
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

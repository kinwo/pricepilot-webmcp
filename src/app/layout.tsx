import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PricePilot — Agentic Price Discovery",
  description: "A WebMCP-enabled marketplace where people and agents discover fairer prices together.",
  metadataBase: new URL(process.env.RENDER_EXTERNAL_URL ?? "http://localhost:3000"),
  openGraph: {
    title: "PricePilot — Agentic Price Discovery",
    description: "Discover, negotiate, group-buy, and subscribe to fair laptop prices with WebMCP.",
    type: "website"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}


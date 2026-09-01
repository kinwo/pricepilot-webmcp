import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LightningPricePilot — Agentic Price Discovery",
    short_name: "LightningPricePilot",
    description: "Discover, negotiate, group-buy, and subscribe to fair laptop prices with WebMCP.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f6f3ea",
    theme_color: "#132238",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any"
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable"
      }
    ]
  };
}

import { defineConfig } from "vitest/config";
import { config } from "dotenv";
import path from "node:path";

config({ path: ".env.local", quiet: true });
config({ quiet: true });

export default defineConfig({
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "./src") } },
  test: {
    include: ["tests/integration/**/*.test.ts"],
    environment: "node",
    sequence: { concurrent: false }
  }
});

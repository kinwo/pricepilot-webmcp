import { NextResponse } from "next/server";
import { count } from "drizzle-orm";
import { getDb } from "@/db/client";
import { products } from "@/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = performance.now();
  try {
    const [catalog] = await getDb().select({ count: count() }).from(products);
    return NextResponse.json({
      ok: true,
      database: "ready",
      migrations: "applied",
      productCount: catalog.count,
      latencyMs: Math.round(performance.now() - startedAt)
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, database: "unavailable" },
      { status: 503 }
    );
  }
}

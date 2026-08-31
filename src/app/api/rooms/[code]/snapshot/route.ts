import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/http";
import { getRoomSnapshot } from "@/lib/room-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const roleSchema = z.enum(["shopper", "merchant"]);

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await context.params;
    const role = roleSchema.parse(request.nextUrl.searchParams.get("role") ?? "shopper");
    const snapshot = await getRoomSnapshot(code, role);
    return NextResponse.json({ ok: true, snapshot });
  } catch (error) {
    return apiError(error);
  }
}


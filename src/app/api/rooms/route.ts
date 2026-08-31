import { NextResponse } from "next/server";
import { apiError } from "@/lib/http";
import { createRoom } from "@/lib/room-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const room = await createRoom();
    return NextResponse.json({ ok: true, ...room }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}


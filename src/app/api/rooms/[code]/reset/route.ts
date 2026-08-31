import { NextResponse } from "next/server";
import { apiError } from "@/lib/http";
import { resetRoom } from "@/lib/room-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  context: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await context.params;
    return NextResponse.json(await resetRoom(code));
  } catch (error) {
    return apiError(error);
  }
}


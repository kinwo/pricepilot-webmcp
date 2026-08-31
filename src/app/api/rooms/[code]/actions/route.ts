import { NextRequest, NextResponse } from "next/server";
import { actionRequestSchema } from "@/lib/contracts";
import { apiError } from "@/lib/http";
import { executeRoomAction } from "@/lib/room-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await context.params;
    const body = actionRequestSchema.parse(await request.json());
    const result = await executeRoomAction(code, body.role, body.action, body.input);
    return NextResponse.json(result);
  } catch (error) {
    return apiError(error);
  }
}


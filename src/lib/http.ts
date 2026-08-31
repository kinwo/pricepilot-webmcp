import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "./room-service";

export function apiError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid request",
        details: error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message }))
      },
      { status: 422 }
    );
  }
  if (error instanceof AppError) {
    return NextResponse.json(
      { ok: false, error: error.message, details: error.details },
      { status: error.status }
    );
  }
  console.error(error);
  return NextResponse.json(
    { ok: false, error: "Unexpected server error" },
    { status: 500 }
  );
}


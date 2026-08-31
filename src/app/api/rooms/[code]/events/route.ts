import { NextRequest } from "next/server";
import { roomCodeSchema } from "@/lib/contracts";
import { getOutboxAfter, roomExists } from "@/lib/room-service";
import { subscribeToRoom, type RoomEvent } from "@/lib/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const encoder = new TextEncoder();

function encodeEvent(event: RoomEvent) {
  return encoder.encode(
    `id: ${event.id}\nevent: room-event\ndata: ${JSON.stringify(event)}\n\n`
  );
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  const { code: rawCode } = await context.params;
  const code = roomCodeSchema.safeParse(rawCode);
  if (!code.success || !(await roomExists(code.data))) {
    return new Response(JSON.stringify({ ok: false, error: "Demo room not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }

  const queryAfter = Number(request.nextUrl.searchParams.get("after") ?? 0);
  const headerAfter = Number(request.headers.get("last-event-id") ?? 0);
  const after = Number.isFinite(Math.max(queryAfter, headerAfter)) ? Math.max(queryAfter, headerAfter) : 0;
  let cleanup = () => {};

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      let live = false;
      let lastSent = after;
      const pending: RoomEvent[] = [];

      const send = (event: RoomEvent) => {
        if (closed || event.id <= lastSent) return;
        controller.enqueue(encodeEvent(event));
        lastSent = event.id;
      };

      const unsubscribe = subscribeToRoom(code.data, (event) => {
        if (live) send(event);
        else pending.push(event);
      });

      const keepalive = setInterval(() => {
        if (!closed) controller.enqueue(encoder.encode(`: keepalive ${Date.now()}\n\n`));
      }, 15_000);

      cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(keepalive);
        unsubscribe();
      };

      request.signal.addEventListener("abort", cleanup, { once: true });

      try {
        const backlog = await getOutboxAfter(code.data, after);
        for (const event of backlog) send(event);
        live = true;
        for (const event of pending.sort((a, b) => a.id - b.id)) send(event);
        controller.enqueue(encoder.encode(": connected\n\n"));
      } catch (error) {
        cleanup();
        controller.error(error);
      }
    },
    cancel() {
      cleanup();
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no"
    }
  });
}

import { afterAll, describe, expect, it } from "vitest";
import { eq, inArray } from "drizzle-orm";
import { getDb, getPool } from "@/db/client";
import { SHOWCASE_PRODUCT_ID } from "@/db/demo-data";
import { notifications, rooms } from "@/db/schema";
import {
  createRoom,
  executeRoomAction,
  getOutboxAfter,
  getRoomSnapshot,
  resetRoom
} from "@/lib/room-service";
import { subscribeToRoom } from "@/lib/events";

const describeWithDatabase = process.env.DATABASE_URL ? describe : describe.skip;
const createdRooms: string[] = [];

async function freshRoom() {
  const room = await createRoom();
  createdRooms.push(room.code);
  return room.code;
}

afterAll(async () => {
  if (!process.env.DATABASE_URL) return;
  if (createdRooms.length) await getDb().delete(rooms).where(inArray(rooms.code, createdRooms));
  await getPool().end();
});

describeWithDatabase("persisted room behavior", () => {
  it("isolates rooms and restores deterministic state", async () => {
    const first = await freshRoom();
    const second = await freshRoom();
    await executeRoomAction(first, "shopper", "join_group_buy", { productId: SHOWCASE_PRODUCT_ID });

    expect((await getRoomSnapshot(first, "shopper")).products.find((item) => item.id === SHOWCASE_PRODUCT_ID)?.groupCount).toBe(5);
    expect((await getRoomSnapshot(second, "shopper")).products.find((item) => item.id === SHOWCASE_PRODUCT_ID)?.groupCount).toBe(4);

    await resetRoom(first);
    const reset = await getRoomSnapshot(first, "shopper");
    expect(reset.products.find((item) => item.id === SHOWCASE_PRODUCT_ID)?.groupCount).toBe(4);
    expect(reset.offers).toHaveLength(0);
    expect(reset.bargains).toHaveLength(0);
  });

  it("makes concurrent duplicate group joins idempotent", async () => {
    const code = await freshRoom();
    const results = await Promise.all([
      executeRoomAction(code, "shopper", "join_group_buy", { productId: SHOWCASE_PRODUCT_ID }),
      executeRoomAction(code, "shopper", "join_group_buy", { productId: SHOWCASE_PRODUCT_ID })
    ]);
    const joined = results.map((result) => (result.data as { joined: boolean }).joined).sort();
    expect(joined).toEqual([false, true]);
    expect((await getRoomSnapshot(code, "shopper")).products.find((item) => item.id === SHOWCASE_PRODUCT_ID)?.groupCount).toBe(5);
  });

  it("matches subscriptions, persists notifications, and backfills SSE events", async () => {
    const code = await freshRoom();
    const before = (await getRoomSnapshot(code, "shopper")).latestEventId;
    const subscription = await executeRoomAction(code, "shopper", "subscribe_bargains", {
      productId: SHOWCASE_PRODUCT_ID,
      condition: "excellent",
      targetPriceCents: 80_000
    });
    expect(subscription.summary).toContain("$800");
    expect(subscription.summary).not.toContain("cents");

    const liveEvent = new Promise<{ id: number; type: string }>((resolve) => {
      const unsubscribe = subscribeToRoom(code, (event) => {
        if (event.type === "bargain.published") {
          unsubscribe();
          resolve(event);
        }
      });
    });
    await executeRoomAction(code, "merchant", "publish_bargain", {
      productId: SHOWCASE_PRODUCT_ID,
      condition: "excellent",
      priceCents: 79_000,
      inventory: 3,
      expiresInMinutes: 60,
      message: "A limited refurbished batch is ready."
    });

    expect((await liveEvent).type).toBe("bargain.published");
    const shopper = await getRoomSnapshot(code, "shopper");
    expect(shopper.notifications).toHaveLength(1);
    expect(shopper.notifications[0]).toMatchObject({
      message: "A limited refurbished batch is ready. Price: $790; 3 available.",
      read: false
    });

    const [storedNotification] = await getDb()
      .select({ id: notifications.id, message: notifications.message })
      .from(notifications)
      .where(eq(notifications.id, shopper.notifications[0].id));
    expect(storedNotification.message).toContain("Price: $790");

    await getDb()
      .update(notifications)
      .set({ message: "A limited refurbished batch is ready. Price: 79000 cents; 3 available." })
      .where(eq(notifications.id, storedNotification.id));
    const legacyShopper = await getRoomSnapshot(code, "shopper");
    expect(legacyShopper.notifications[0].message).toBe(
      "A limited refurbished batch is ready. Price: $790; 3 available."
    );

    const backlog = await getOutboxAfter(code, before);
    expect(backlog.some((event) => event.type === "bargain.published")).toBe(true);
  });

  it("returns one mock order for concurrent duplicate checkout", async () => {
    const code = await freshRoom();
    const offer = await executeRoomAction(code, "shopper", "request_offer", {
      productId: SHOWCASE_PRODUCT_ID,
      condition: "excellent",
      targetPriceCents: 80_000
    });
    expect(offer.summary).toContain("$");
    expect(offer.summary).not.toContain("cents");
    const offerId = (offer.data as { offerId: string }).offerId;
    const orders = await Promise.all([
      executeRoomAction(code, "shopper", "prepare_mock_checkout", { offerId }),
      executeRoomAction(code, "shopper", "prepare_mock_checkout", { offerId })
    ]);
    expect((orders[0].data as { orderId: string }).orderId).toBe((orders[1].data as { orderId: string }).orderId);
    expect((await getRoomSnapshot(code, "shopper")).offers[0].status).toBe("checked_out");
  });

  it("rejects invalid role actions and invalid inventory", async () => {
    const code = await freshRoom();
    await expect(executeRoomAction(code, "shopper", "publish_bargain", {})).rejects.toMatchObject({ status: 403 });
    await expect(executeRoomAction(code, "merchant", "publish_bargain", {
      productId: SHOWCASE_PRODUCT_ID,
      condition: "excellent",
      priceCents: 79_000,
      inventory: 100,
      expiresInMinutes: 60,
      message: "Too much inventory"
    })).rejects.toMatchObject({ status: 422 });
  });
});

import { EventEmitter } from "node:events";

export type RoomEvent = {
  id: number;
  roomCode: string;
  type: string;
  payload: Record<string, unknown>;
  createdAt: string;
};

type EventsGlobal = typeof globalThis & { __pricePilotEvents?: EventEmitter };
const eventsGlobal = globalThis as EventsGlobal;

export function getEventBus() {
  if (!eventsGlobal.__pricePilotEvents) {
    eventsGlobal.__pricePilotEvents = new EventEmitter();
    eventsGlobal.__pricePilotEvents.setMaxListeners(200);
  }
  return eventsGlobal.__pricePilotEvents;
}

export function emitRoomEvent(event: RoomEvent) {
  getEventBus().emit(`room:${event.roomCode}`, event);
}

export function subscribeToRoom(roomCode: string, listener: (event: RoomEvent) => void) {
  const bus = getEventBus();
  const channel = `room:${roomCode}`;
  bus.on(channel, listener);
  return () => bus.off(channel, listener);
}


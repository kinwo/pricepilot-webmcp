import { RoomApp } from "@/components/room-app";

export default async function ShopperPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <RoomApp roomCode={code} role="shopper" />;
}


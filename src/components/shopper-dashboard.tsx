"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { FiArrowRight, FiBell, FiCheckCircle, FiClock, FiSearch, FiShoppingCart, FiTag, FiUsers, FiZap } from "react-icons/fi";
import { TbRobot } from "react-icons/tb";
import type { RoomSnapshot } from "@/lib/view-types";
import { formatDateTime, formatMoney } from "@/lib/utils";
import type { ConfirmAction, RunAction } from "./room-app";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Progress } from "./ui/progress";

type PriceComparison = {
  productName: string;
  condition: string;
  groupCount: number;
  options: Array<{ source: string; label: string; priceCents: number; available: boolean; detail: string }>;
};

export function ShopperDashboard({
  snapshot,
  runAction,
  confirmAction
}: {
  snapshot: RoomSnapshot;
  runAction: RunAction;
  confirmAction: ConfirmAction;
}) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(snapshot.products[0]?.id ?? "");
  const [condition, setCondition] = useState<"new" | "excellent" | "good">("excellent");
  const [targetDollars, setTargetDollars] = useState("800");
  const [comparison, setComparison] = useState<PriceComparison | null>(null);
  const [working, setWorking] = useState("");
  const [error, setError] = useState("");

  const products = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    if (!normalized) return snapshot.products;
    return snapshot.products.filter((product) =>
      `${product.name} ${product.tagline} ${product.useCase} ${product.tags.join(" ")}`.toLowerCase().includes(normalized)
    );
  }, [query, snapshot.products]);
  const selected = snapshot.products.find((product) => product.id === selectedId) ?? snapshot.products[0];
  async function act(label: string, callback: () => Promise<unknown>) {
    setWorking(label);
    setError("");
    try {
      return await callback();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The action could not be completed.");
    } finally {
      setWorking("");
    }
  }

  async function compare() {
    if (!selected) return;
    const result = await act("compare", () => runAction("get_price_options", { productId: selected.id, condition }));
    if (result && typeof result === "object" && "data" in result) setComparison(result.data as PriceComparison);
  }

  async function negotiate() {
    if (!selected) return;
    await act("negotiate", () => runAction("request_offer", {
      productId: selected.id,
      condition,
      targetPriceCents: Math.round(Number(targetDollars) * 100)
    }));
  }

  async function joinGroup() {
    if (!selected) return;
    await act("group", () => confirmAction("join_group_buy", { productId: selected.id }, {
      title: `Join the ${selected.name} group buy?`,
      description: "This is a non-binding demo commitment. It may unlock a lower price for everyone in this room.",
      confirmLabel: "Join the group"
    }));
  }

  async function subscribe() {
    if (!selected) return;
    await act("subscribe", () => confirmAction("subscribe_bargains", {
      productId: selected.id,
      condition,
      targetPriceCents: Math.round(Number(targetDollars) * 100)
    }, {
      title: `Watch ${selected.name} for bargains?`,
      description: `Save a private ${condition} target of ${formatMoney(Math.round(Number(targetDollars) * 100))}. The merchant sees only aggregate demand.`,
      confirmLabel: "Save subscription"
    }));
  }

  async function checkout(offerId: string, productName: string, priceCents: number) {
    await act(offerId, () => confirmAction("prepare_mock_checkout", { offerId }, {
      title: `Place a mock order for ${productName}?`,
      description: `You are approving a fictional order for ${formatMoney(priceCents)}. No payment or personal information is collected.`,
      confirmLabel: "Place mock order"
    }));
  }

  if (!selected) return null;
  const selectedPrice = condition === "new" ? selected.listPriceCents : condition === "good" ? selected.goodPriceCents : selected.excellentPriceCents;
  const progressTarget = selected.groupCount < 5 ? 5 : selected.groupCount < 10 ? 10 : selected.groupCount;
  const progress = progressTarget ? Math.min(100, (selected.groupCount / progressTarget) * 100) : 100;

  return (
    <main className="mx-auto max-w-[1450px] px-4 pb-20 pt-8 sm:px-6">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <Badge variant="coral">Shopper workspace</Badge>
          <h1 className="font-display mt-3 text-4xl font-black tracking-[-0.045em] sm:text-5xl">Your buying intent,<br className="hidden sm:block" /> working in your favor.</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted)]">Browse manually or ask ChatGPT to discover, compare, negotiate, and watch prices using the same visible storefront state.</p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm shadow-sm">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--navy)] text-lg text-[var(--lime)]"><TbRobot /></span>
          <div><p className="font-bold">Agent-ready page</p><p className="text-xs text-[var(--muted)]">7 shopper tools · human approval</p></div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><h2 className="font-display text-2xl font-black">Laptop discovery</h2><p className="text-sm text-[var(--muted)]">Eight fictional products; live prices are isolated to room {snapshot.room.code}.</p></div>
            <div className="relative w-full sm:max-w-xs"><FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search coding, student, creative…" className="pl-10" /></div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {products.map((product) => {
              const active = product.id === selected.id;
              const target = product.groupCount < 5 ? 5 : 10;
              return (
                <button key={product.id} type="button" onClick={() => { setSelectedId(product.id); setComparison(null); }} className="text-left">
                  <Card className={`group h-full overflow-hidden transition hover:-translate-y-1 hover:shadow-[0_25px_70px_rgba(29,42,62,0.12)] ${active ? "border-[var(--navy)] ring-2 ring-[rgba(19,34,56,0.08)]" : ""}`}>
                    <div className="relative h-44 overflow-hidden bg-[#edf0e9]"><Image src={product.imagePath} alt="" fill className="object-cover transition duration-500 group-hover:scale-[1.03]" /><div className="absolute left-4 top-4 flex gap-2"><Badge variant={product.activeBargain ? "coral" : "neutral"}>{product.activeBargain ? "Live bargain" : product.useCase}</Badge></div></div>
                    <CardHeader><CardTitle>{product.name}</CardTitle><CardDescription>{product.tagline}</CardDescription></CardHeader>
                    <CardContent>
                      <div className="flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Best now</p><p className="font-display text-2xl font-black">{formatMoney(product.bestPriceCents)}</p></div><div className="text-right"><p className="text-xs text-[var(--muted)]">List {formatMoney(product.listPriceCents)}</p><p className="text-xs font-bold text-[var(--teal)]">Refurbished available</p></div></div>
                      <div className="mt-4"><div className="mb-2 flex justify-between text-[11px] font-bold"><span>{product.groupCount} buyers joined</span><span>{Math.max(0, target - product.groupCount)} to next tier</span></div><Progress value={Math.min(100, (product.groupCount / target) * 100)} /></div>
                    </CardContent>
                  </Card>
                </button>
              );
            })}
          </div>
        </section>

        <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
          <Card className="overflow-hidden border-0 bg-[var(--navy)] text-white">
            <div className="bg-[linear-gradient(135deg,rgba(207,255,101,0.15),transparent_45%)] p-5">
              <div className="flex items-center justify-between"><Badge variant="lime">Price workbench</Badge><FiZap className="text-xl text-[var(--lime)]" /></div>
              <h2 className="font-display mt-4 text-2xl font-black">{selected.name}</h2>
              <p className="mt-1 text-sm text-white/60">{selected.useCase}</p>
              <div className="mt-5 grid grid-cols-3 gap-2">
                {(["new", "excellent", "good"] as const).map((item) => (
                  <button key={item} onClick={() => { setCondition(item); setComparison(null); }} className={`rounded-xl px-2 py-2.5 text-xs font-bold capitalize transition ${condition === item ? "bg-[var(--lime)] text-[var(--navy)]" : "bg-white/8 text-white/70 hover:bg-white/15"}`}>{item}</button>
                ))}
              </div>
              <div className="mt-5 flex items-end justify-between"><div><p className="text-xs uppercase tracking-wider text-white/50">Current {condition}</p><p className="font-display text-3xl font-black">{formatMoney(selectedPrice)}</p></div><p className="text-xs text-white/50">{selected.stock[condition]} in stock</p></div>
              <Button variant="lime" className="mt-4 w-full" onClick={compare} disabled={working === "compare"}>{working === "compare" ? "Comparing…" : "Compare every price path"}<FiArrowRight /></Button>
            </div>
          </Card>

          {comparison && (
            <Card className="p-5">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--coral)]">Transparent options</p>
              <div className="mt-4 space-y-3">
                {comparison.options.map((option) => (
                  <div key={option.source} className={`rounded-2xl border p-3.5 ${option.available ? "border-[var(--line)] bg-white" : "border-dashed border-[#cdd1ca] bg-[#f4f5f1] opacity-70"}`}>
                    <div className="flex items-center justify-between gap-3"><p className="text-sm font-bold">{option.label}</p><p className="font-display text-lg font-black">{formatMoney(option.priceCents)}</p></div><p className="mt-1 text-xs leading-5 text-[var(--muted)]">{option.detail}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><FiTag className="text-[var(--coral)]" /> Negotiate or watch</CardTitle><CardDescription>Use one target for an instant offer or a future bargain subscription.</CardDescription></CardHeader>
            <CardContent>
              <label className="text-xs font-bold text-[var(--muted)]">Target price (USD)</label>
              <div className="mt-2 flex gap-2"><div className="relative flex-1"><span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-[var(--muted)]">$</span><Input type="number" min="100" value={targetDollars} onChange={(event) => setTargetDollars(event.target.value)} className="pl-7" /></div><Button variant="coral" onClick={negotiate} disabled={working === "negotiate"}>{working === "negotiate" ? "Working…" : "Negotiate"}</Button></div>
              <div className="mt-3 grid grid-cols-2 gap-2"><Button variant="outline" size="sm" onClick={joinGroup} disabled={working === "group"}><FiUsers /> Join group</Button><Button variant="outline" size="sm" onClick={subscribe} disabled={working === "subscribe"}><FiBell /> Watch price</Button></div>
              {error && <p className="mt-3 text-xs font-semibold leading-5 text-[#9a3328]" role="alert">{error}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><FiUsers className="text-[var(--teal)]" /> Group demand</CardTitle><CardDescription>{selected.groupCount} commitments currently shape this product’s price.</CardDescription></CardHeader>
            <CardContent><Progress value={progress} /><div className="mt-3 flex items-center justify-between text-xs"><span>{selected.groupCount} joined</span><strong>{selected.nextGroupCount ? `${selected.nextGroupCount - selected.groupCount} to unlock` : "Top tier unlocked"}</strong></div></CardContent>
          </Card>
        </aside>
      </div>

      <div className="mt-10 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><FiBell className="text-[var(--coral)]" /> Bargain inbox</CardTitle><CardDescription>Merchant agents can proactively match your saved intent, even after your original search.</CardDescription></CardHeader>
          <CardContent>
            {snapshot.notifications.length ? <div className="space-y-3">{snapshot.notifications.map((notification) => (
              <div key={notification.id} className="flex gap-3 rounded-2xl border border-[#f3c8c1] bg-[#fff3f0] p-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--coral)] text-white"><FiBell /></span><div><div className="flex flex-wrap items-center gap-2"><p className="font-bold">{notification.title}</p><Badge variant="coral">Merchant message</Badge></div><p className="mt-1 text-sm leading-6 text-[var(--muted)]">{notification.message}</p><p className="mt-2 text-xs text-[var(--muted)]">{formatDateTime(notification.createdAt)}</p></div></div>
            ))}</div> : <EmptyState icon={<FiBell />} title="No bargains yet" body="Save a target price, then publish a matching bargain from the merchant view." />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><FiClock className="text-[var(--teal)]" /> Negotiation activity</CardTitle><CardDescription>Offers are non-binding for ten minutes. Checkout remains human-confirmed.</CardDescription></CardHeader>
          <CardContent>
            {snapshot.offers.length ? <div className="space-y-3">{snapshot.offers.slice(0, 8).map((offer) => (
              <div key={offer.id} className="flex flex-col gap-3 rounded-2xl border border-[var(--line)] bg-white p-4 sm:flex-row sm:items-center"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${offer.status === "checked_out" ? "bg-[#ddf7f1] text-[var(--teal)]" : "bg-[#eef0ec]"}`}>{offer.status === "checked_out" ? <FiCheckCircle /> : <FiTag />}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-bold">{offer.productName}</p><Badge variant={offer.status === "accepted" ? "teal" : offer.status === "countered" ? "coral" : "neutral"}>{offer.status}</Badge></div><p className="mt-1 text-xs text-[var(--muted)]">Target {formatMoney(offer.targetPriceCents)} · Offer <strong className="text-[var(--navy)]">{formatMoney(offer.offeredPriceCents)}</strong> · {offer.condition}</p></div>{["accepted", "countered"].includes(offer.status) && <Button size="sm" variant="coral" onClick={() => checkout(offer.id, offer.productName, offer.offeredPriceCents)} disabled={working === offer.id}><FiShoppingCart /> {working === offer.id ? "Placing…" : "Mock checkout"}</Button>}</div>
            ))}</div> : <EmptyState icon={<FiTag />} title="No offers yet" body="Select a laptop and request a target price to start the negotiation timeline." />}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function EmptyState({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return <div className="rounded-2xl border border-dashed border-[#cbd0c8] bg-[#f7f7f3] p-8 text-center"><span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-white text-lg text-[var(--muted)] shadow-sm">{icon}</span><p className="mt-3 font-bold">{title}</p><p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-[var(--muted)]">{body}</p></div>;
}

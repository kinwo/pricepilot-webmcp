"use client";

import { FormEvent, useMemo, useState } from "react";
import { FiActivity, FiBell, FiDollarSign, FiLayers, FiLock, FiSliders, FiTrendingUp, FiUsers, FiXCircle, FiZap } from "react-icons/fi";
import { TbRobot } from "react-icons/tb";
import type { RoomSnapshot } from "@/lib/view-types";
import { formatDateTime, formatMoney } from "@/lib/utils";
import type { ConfirmAction, RunAction } from "./room-app";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input, Textarea } from "./ui/input";
import { Progress } from "./ui/progress";

export function MerchantDashboard({
  snapshot,
  confirmAction
}: {
  snapshot: RoomSnapshot;
  runAction: RunAction;
  confirmAction: ConfirmAction;
}) {
  const [selectedId, setSelectedId] = useState(snapshot.products[0]?.id ?? "");
  const selected = snapshot.products.find((product) => product.id === selectedId) ?? snapshot.products[0];
  const policy = snapshot.policies.find((item) => item.productId === selected?.id);
  const demand = snapshot.demand.find((item) => item.productId === selected?.id);
  const [floorDollars, setFloorDollars] = useState(() => policy ? String(Math.round(policy.floorPriceCents / 100)) : "");
  const [maxDiscount, setMaxDiscount] = useState(() => String(policy?.maxInstantDiscountPercent ?? 5));
  const [tierOne, setTierOne] = useState(() => String(policy?.tierOneDiscountPercent ?? 8));
  const [tierTwo, setTierTwo] = useState(() => String(policy?.tierTwoDiscountPercent ?? 12));
  const [condition, setCondition] = useState<"new" | "excellent" | "good">("excellent");
  const [bargainDollars, setBargainDollars] = useState(() => selected ? String(Math.floor(selected.excellentPriceCents / 100 * 0.94)) : "");
  const [inventory, setInventory] = useState("3");
  const [expiry, setExpiry] = useState("60");
  const [message, setMessage] = useState("A limited refurbished batch just became available for intent subscribers.");
  const [working, setWorking] = useState("");
  const [error, setError] = useState("");

  function selectProduct(productId: string) {
    setSelectedId(productId);
    const nextPolicy = snapshot.policies.find((item) => item.productId === productId);
    const nextProduct = snapshot.products.find((item) => item.id === productId);
    if (nextPolicy) {
      setFloorDollars(String(Math.round(nextPolicy.floorPriceCents / 100)));
      setMaxDiscount(String(nextPolicy.maxInstantDiscountPercent));
      setTierOne(String(nextPolicy.tierOneDiscountPercent));
      setTierTwo(String(nextPolicy.tierTwoDiscountPercent));
    }
    if (nextProduct) setBargainDollars(String(Math.floor(nextProduct.excellentPriceCents / 100 * 0.94)));
  }

  const totals = useMemo(() => ({
    commitments: snapshot.demand.reduce((sum, item) => sum + item.groupCount, 0),
    subscribers: snapshot.demand.reduce((sum, item) => sum + item.subscriberCount, 0),
    offers: snapshot.demand.reduce((sum, item) => sum + item.offerCount, 0),
    activeBargains: snapshot.bargains.filter((item) => item.status === "active").length
  }), [snapshot]);

  async function act(label: string, callback: () => Promise<unknown>) {
    setWorking(label);
    setError("");
    try { await callback(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "The action could not be completed."); }
    finally { setWorking(""); }
  }

  async function savePolicy(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    await act("policy", () => confirmAction("set_pricing_policy", {
      productId: selected.id,
      floorPriceCents: Math.round(Number(floorDollars) * 100),
      maxInstantDiscountPercent: Number(maxDiscount),
      tierOneDiscountPercent: Number(tierOne),
      tierTwoDiscountPercent: Number(tierTwo)
    }, {
      title: `Update ${selected.name} guardrails?`,
      description: "The private floor and discounts will affect future instant offers and group-buy prices.",
      confirmLabel: "Update policy"
    }));
  }

  async function publish(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    await act("bargain", () => confirmAction("publish_bargain", {
      productId: selected.id,
      condition,
      priceCents: Math.round(Number(bargainDollars) * 100),
      inventory: Number(inventory),
      expiresInMinutes: Number(expiry),
      message
    }, {
      title: `Publish a ${selected.name} bargain?`,
      description: `${demand?.subscriberCount ?? 0} intent subscriber(s) may qualify. Matching shoppers will be notified immediately.`,
      confirmLabel: "Publish bargain"
    }));
  }

  async function closeBargain(id: string, name: string) {
    await act(id, () => confirmAction("close_bargain", { bargainId: id }, {
      title: `Close the ${name} bargain?`,
      description: "Shoppers will no longer receive this price, but the audit trail will remain.",
      confirmLabel: "Close bargain"
    }));
  }

  if (!selected || !policy) return null;

  return (
    <main className="mx-auto max-w-[1450px] px-4 pb-20 pt-8 sm:px-6">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div><Badge variant="navy">Merchant workspace</Badge><h1 className="font-display mt-3 text-4xl font-black tracking-[-0.045em] sm:text-5xl">Turn demand signals<br className="hidden sm:block" /> into fair offers.</h1><p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted)]">ChatGPT sees aggregate intent—not individual budgets—and can propose pricing actions within merchant-controlled guardrails.</p></div>
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm shadow-sm"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--navy)] text-lg text-[var(--lime)]"><TbRobot /></span><div><p className="font-bold">Merchant agent surface</p><p className="text-xs text-[var(--muted)]">5 tools · aggregate insight only</p></div></div>
      </div>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Group commitments", value: totals.commitments, icon: FiUsers, color: "bg-[#efffd4]" },
          { label: "Intent subscribers", value: totals.subscribers, icon: FiBell, color: "bg-[#fff0ed]" },
          { label: "Offers requested", value: totals.offers, icon: FiActivity, color: "bg-[#e7f8f4]" },
          { label: "Active bargains", value: totals.activeBargains, icon: FiZap, color: "bg-[#ececf8]" }
        ].map((item) => <Card key={item.label} className="p-5"><div className="flex items-center justify-between"><span className={`grid h-11 w-11 place-items-center rounded-2xl ${item.color}`}><item.icon /></span><p className="font-display text-3xl font-black">{item.value}</p></div><p className="mt-5 text-sm font-bold">{item.label}</p><p className="mt-1 text-xs text-[var(--muted)]">Across this private demo room</p></Card>)}
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="space-y-6">
          <Card>
            <CardHeader><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><CardTitle className="flex items-center gap-2"><FiTrendingUp className="text-[var(--teal)]" /> Aggregate demand board</CardTitle><CardDescription>Individual targets never appear here; only totals and averages are exposed.</CardDescription></div><select value={selectedId} onChange={(event) => selectProduct(event.target.value)} className="h-11 rounded-xl border border-[var(--line)] bg-white px-3 text-sm font-bold outline-none">{snapshot.products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></div></CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <Metric label="Group commitments" value={String(demand?.groupCount ?? 0)} note={`${Math.max(0, 5 - (demand?.groupCount ?? 0))} to first tier`} />
                <Metric label="Bargain subscribers" value={String(demand?.subscriberCount ?? 0)} note="Waiting for qualifying price" />
                <Metric label="Average target" value={demand?.averageTargetPriceCents ? formatMoney(demand.averageTargetPriceCents) : "—"} note="Aggregate, privacy-preserving" />
              </div>
              <div className="mt-5 rounded-2xl bg-[#f4f5f1] p-4"><div className="mb-2 flex justify-between text-xs font-bold"><span>Demand-based price progress</span><span>{demand?.groupCount ?? 0} / 5 buyers</span></div><Progress value={Math.min(100, ((demand?.groupCount ?? 0) / 5) * 100)} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><FiLayers className="text-[var(--coral)]" /> Live bargains</CardTitle><CardDescription>Published offers are matched against saved shopper intent immediately.</CardDescription></CardHeader>
            <CardContent>
              {snapshot.bargains.length ? <div className="space-y-3">{snapshot.bargains.map((bargain) => (
                <div key={bargain.id} className="flex flex-col gap-3 rounded-2xl border border-[var(--line)] p-4 sm:flex-row sm:items-center"><span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${bargain.status === "active" ? "bg-[#efffd4] text-[#527515]" : "bg-[#eef0ec] text-[var(--muted)]"}`}><FiDollarSign /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-bold">{bargain.productName}</p><Badge variant={bargain.status === "active" ? "lime" : "neutral"}>{bargain.status}</Badge><Badge variant="neutral">{bargain.condition}</Badge></div><p className="mt-1 text-sm text-[var(--muted)]">{formatMoney(bargain.priceCents)} · {bargain.inventory} unit(s) · ends {formatDateTime(bargain.expiresAt)}</p><p className="mt-1 truncate text-xs text-[var(--muted)]">“{bargain.message}”</p></div>{bargain.status === "active" && <Button variant="outline" size="sm" onClick={() => closeBargain(bargain.id, bargain.productName)} disabled={working === bargain.id}><FiXCircle /> Close</Button>}</div>
              ))}</div> : <div className="rounded-2xl border border-dashed border-[#cbd0c8] bg-[#f7f7f3] p-8 text-center"><FiZap className="mx-auto text-2xl text-[var(--muted)]" /><p className="mt-3 font-bold">No bargains published</p><p className="mt-1 text-sm text-[var(--muted)]">Use the publisher to turn aggregate demand into a targeted offer.</p></div>}
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><FiActivity className="text-[var(--teal)]" /> Offer activity</CardTitle></CardHeader><CardContent><div className="space-y-3">{snapshot.offers.slice(0, 8).map((offer) => <div key={offer.id} className="rounded-2xl border border-[var(--line)] p-3.5"><div className="flex items-center justify-between gap-3"><p className="text-sm font-bold">{offer.productName}</p><Badge variant={offer.status === "accepted" ? "teal" : offer.status === "countered" ? "coral" : "neutral"}>{offer.status}</Badge></div><p className="mt-1 text-xs text-[var(--muted)]">Target {formatMoney(offer.targetPriceCents)} → {formatMoney(offer.offeredPriceCents)}</p></div>)}{!snapshot.offers.length && <p className="py-8 text-center text-sm text-[var(--muted)]">No shopper offers yet.</p>}</div></CardContent></Card>
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><FiLock className="text-[var(--coral)]" /> Audit trail</CardTitle></CardHeader><CardContent><div className="space-y-4">{snapshot.audit.slice(0, 8).map((event) => <div key={event.id} className="flex gap-3"><span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--teal)]" /><div><p className="text-sm font-semibold leading-5">{event.summary}</p><p className="mt-1 text-[11px] text-[var(--muted)]">{event.actor} · {formatDateTime(event.createdAt)}</p></div></div>)}</div></CardContent></Card>
          </div>
        </section>

        <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
          <Card className="border-0 bg-[var(--navy)] text-white">
            <CardHeader><Badge variant="lime" className="w-fit">Merchant action</Badge><CardTitle className="mt-2 text-white">Publish a targeted bargain</CardTitle><CardDescription className="text-white/60">Price must remain above the private floor and below the current condition price.</CardDescription></CardHeader>
            <CardContent>
              <form onSubmit={publish} className="space-y-4">
                <div className="grid grid-cols-3 gap-2">{(["new", "excellent", "good"] as const).map((item) => <button type="button" key={item} onClick={() => setCondition(item)} className={`rounded-xl px-2 py-2.5 text-xs font-bold capitalize ${condition === item ? "bg-[var(--lime)] text-[var(--navy)]" : "bg-white/8 text-white/70"}`}>{item}</button>)}</div>
                <div className="grid grid-cols-2 gap-3"><Field label="Price (USD)"><Input type="number" min="100" value={bargainDollars} onChange={(event) => setBargainDollars(event.target.value)} /></Field><Field label="Inventory"><Input type="number" min="1" max="100" value={inventory} onChange={(event) => setInventory(event.target.value)} /></Field></div>
                <Field label="Expires in minutes"><Input type="number" min="5" max="1440" value={expiry} onChange={(event) => setExpiry(event.target.value)} /></Field>
                <Field label="Shopper-facing message"><Textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={240} /></Field>
                <div className="rounded-xl bg-white/8 p-3 text-xs leading-5 text-white/60"><strong className="text-white">Potential reach:</strong> {demand?.subscriberCount ?? 0} subscriber(s). Actual matching also checks condition and target price.</div>
                <Button type="submit" variant="lime" className="w-full" disabled={working === "bargain"}>{working === "bargain" ? "Publishing…" : "Review and publish"}<FiBell /></Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><FiSliders className="text-[var(--teal)]" /> Pricing guardrails</CardTitle><CardDescription>Private policy values are never included in shopper tools or snapshots.</CardDescription></CardHeader>
            <CardContent>
              <form onSubmit={savePolicy} className="space-y-4">
                <Field label="Private floor (USD)"><Input type="number" min="100" value={floorDollars} onChange={(event) => setFloorDollars(event.target.value)} /></Field>
                <Field label="Maximum instant discount (%)"><Input type="number" min="0" max="25" value={maxDiscount} onChange={(event) => setMaxDiscount(event.target.value)} /></Field>
                <div className="grid grid-cols-2 gap-3"><Field label="5 buyers (%)"><Input type="number" min="1" max="25" value={tierOne} onChange={(event) => setTierOne(event.target.value)} /></Field><Field label="10 buyers (%)"><Input type="number" min="1" max="30" value={tierTwo} onChange={(event) => setTierTwo(event.target.value)} /></Field></div>
                <Button type="submit" variant="outline" className="w-full" disabled={working === "policy"}>{working === "policy" ? "Updating…" : "Review policy update"}<FiSliders /></Button>
              </form>
              {error && <p className="mt-3 text-xs font-semibold leading-5 text-[#9a3328]" role="alert">{error}</p>}
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return <div className="rounded-2xl border border-[var(--line)] bg-white p-4"><p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{label}</p><p className="font-display mt-2 text-3xl font-black">{value}</p><p className="mt-2 text-xs text-[var(--muted)]">{note}</p></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-xs font-bold text-current opacity-70">{label}</span>{children}</label>;
}

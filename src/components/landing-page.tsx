"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiArrowRight, FiBell, FiCheck, FiCopy, FiSearch, FiUsers } from "react-icons/fi";
import { TbRobot, TbScale, TbSparkles } from "react-icons/tb";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";

function SuperPricePilotLogo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="SuperPricePilot home"
      className={`group inline-flex items-center gap-3 text-[var(--navy)] ${className}`}
    >
      <span className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-[0.9rem] shadow-[0_10px_24px_rgba(19,34,56,0.18)] transition-transform duration-200 group-hover:-rotate-3 group-hover:scale-105">
        <Image src="/icon.svg" alt="" width={44} height={44} priority />
      </span>
      <span className="font-display flex flex-col items-start leading-none">
        <span className="mb-1 text-[0.58rem] font-black uppercase tracking-[0.24em] text-[var(--coral)]">
          Super
        </span>
        <span className="text-xl font-extrabold tracking-[-0.045em]">
          Price<span className="text-[var(--coral)]">Pilot</span>
        </span>
      </span>
    </Link>
  );
}

export function LandingPage() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function createDemo() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/rooms", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not create a demo room.");
      router.push(`/room/${data.code}/shopper`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create a demo room.");
      setLoading(false);
    }
  }

  function enterRoom(event: FormEvent) {
    event.preventDefault();
    const normalized = roomCode.trim().toUpperCase();
    if (!/^[A-HJ-NP-Z2-9]{6}$/.test(normalized)) {
      setError("Enter the six-character room code.");
      return;
    }
    router.push(`/room/${normalized}/shopper`);
  }

  return (
    <main className="min-h-screen overflow-hidden">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8">
        <SuperPricePilotLogo />
        <div className="hidden items-center gap-2 rounded-full border border-[var(--line)] bg-white/65 px-4 py-2 text-xs font-semibold text-[var(--muted)] sm:flex">
          <span className="live-dot h-2 w-2 rounded-full bg-[var(--teal)]" />
          WebMCP competition prototype
        </div>
      </nav>

      <section className="relative mx-auto grid max-w-7xl gap-12 px-5 pb-16 pt-10 sm:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:pb-24 lg:pt-20">
        <div className="relative z-10">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#e8ffd0] px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[#45680b]">
            <TbSparkles aria-hidden="true" />
            The price conversation is finally two-way
          </div>
          <h1 className="font-display max-w-3xl text-5xl font-black leading-[0.98] tracking-[-0.055em] text-[var(--navy)] sm:text-6xl lg:text-7xl">
            Find a fair price.<br />
            <span className="relative inline-block text-[var(--coral)]">
              Together.
              <svg className="absolute -bottom-3 left-0 w-full" viewBox="0 0 330 16" fill="none" aria-hidden="true">
                <path d="M4 11C76 2 166 3 326 7" stroke="#CFFF65" strokeWidth="9" strokeLinecap="round" />
              </svg>
            </span>
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-8 text-[var(--muted)]">
            Your ChatGPT browser can compare refurbished laptops, negotiate within transparent merchant rules,
            unlock group prices, and watch for future bargains—while you approve every commitment.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button variant="coral" size="lg" onClick={createDemo} disabled={loading}>
              {loading ? "Seeding your room…" : "Create a demo room"}
              {!loading && <FiArrowRight aria-hidden="true" />}
            </Button>
            <a href="#join-room" className="inline-flex h-13 items-center justify-center rounded-full border border-[var(--line)] bg-white/70 px-7 text-base font-semibold text-[var(--navy)] transition hover:border-[var(--navy)] hover:bg-white">
              I have a room code
            </a>
          </div>
          {error && <p className="mt-4 text-sm font-semibold text-[#9a3328]" role="alert">{error}</p>}
          <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-[var(--muted)]">
            <span className="inline-flex items-center gap-2"><FiCheck className="text-[var(--teal)]" /> No login</span>
            <span className="inline-flex items-center gap-2"><FiCheck className="text-[var(--teal)]" /> No real payment</span>
            <span className="inline-flex items-center gap-2"><FiCheck className="text-[var(--teal)]" /> Reset anytime</span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl">
          <div className="dot-grid absolute -inset-12 -z-10 rounded-[3rem] opacity-50" />
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[var(--lime)] blur-[1px]" />
          <div className="glass-panel relative overflow-hidden rounded-[2.2rem] p-4 sm:p-6">
            <div className="rounded-[1.7rem] bg-[var(--navy)] p-5 text-white sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 text-xl text-[var(--lime)]"><TbRobot /></span>
                  <div><p className="font-display font-bold">Shopper agent</p><p className="text-xs text-white/60">Connected through WebMCP</p></div>
                </div>
                <span className="rounded-full bg-[var(--teal)] px-3 py-1 text-[10px] font-black uppercase tracking-widest">Live</span>
              </div>
              <div className="mt-5 rounded-2xl bg-white/8 p-4 text-sm leading-6 text-white/85">
                “Find a lightweight refurbished laptop under $900. Compare every price path and negotiate if it helps.”
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Card className="border-0 bg-[#fff3f0] p-4 shadow-none">
                <div className="mb-8 flex items-center justify-between"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--coral)] text-white"><FiSearch /></span><span className="text-xs font-bold text-[var(--muted)]">DISCOVER</span></div>
                <p className="font-display text-xl font-bold">Aster Air 13</p><p className="mt-1 text-sm text-[var(--muted)]">Excellent refurbished</p><p className="mt-3 text-2xl font-black">$879</p>
              </Card>
              <Card className="border-0 bg-[#efffd4] p-4 shadow-none">
                <div className="mb-8 flex items-center justify-between"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--lime)] text-[var(--navy)]"><FiUsers /></span><span className="text-xs font-bold text-[var(--muted)]">GROUP</span></div>
                <p className="font-display text-xl font-bold">4 of 5 joined</p><p className="mt-1 text-sm text-[var(--muted)]">One more unlocks</p><p className="mt-3 text-2xl font-black">8% off</p>
              </Card>
            </div>
            <div className="mt-3 flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#ddf7f1] text-[var(--teal)]"><FiBell /></span>
              <div className="min-w-0 flex-1"><p className="text-sm font-bold">A new bargain matched your target</p><p className="truncate text-xs text-[var(--muted)]">Merchant agent published 3 refurbished units.</p></div>
              <FiArrowRight className="text-[var(--muted)]" />
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--line)] bg-white/55">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 py-14 sm:px-8 md:grid-cols-3">
          {[
            { icon: FiSearch, title: "One request, every price path", body: "ChatGPT searches new, refurbished, group, and live bargain prices through structured tools." },
            { icon: TbScale, title: "Negotiation with guardrails", body: "The store returns an instant offer or counteroffer using merchant rules—not invented discounts." },
            { icon: FiBell, title: "Intent becomes a subscription", body: "The merchant can proactively notify interested shoppers when a future bargain qualifies." }
          ].map((item, index) => (
            <div key={item.title} className="flex gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[var(--navy)] text-xl text-[var(--lime)]">{<item.icon />}</span>
              <div><p className="mb-1 text-xs font-black uppercase tracking-[0.14em] text-[var(--coral)]">0{index + 1}</p><h2 className="font-display text-lg font-bold">{item.title}</h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{item.body}</p></div>
            </div>
          ))}
        </div>
      </section>

      <section id="join-room" className="mx-auto max-w-3xl px-5 py-20 text-center sm:px-8">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#e6f8f3] text-2xl text-[var(--teal)]"><FiCopy /></span>
        <h2 className="font-display mt-5 text-3xl font-black tracking-tight">Join the same market</h2>
        <p className="mx-auto mt-3 max-w-lg text-[var(--muted)]">Use a room code in another ChatGPT browser session to demonstrate shopper and merchant agents sharing live, isolated state.</p>
        <form onSubmit={enterRoom} className="mx-auto mt-7 flex max-w-md flex-col gap-3 sm:flex-row">
          <Input value={roomCode} onChange={(event) => setRoomCode(event.target.value)} placeholder="ABC123" maxLength={6} className="h-13 text-center font-mono text-lg font-bold uppercase tracking-[0.3em]" aria-label="Room code" />
          <Button type="submit" size="lg">Enter room <FiArrowRight /></Button>
        </form>
      </section>

      <footer className="border-t border-[var(--line)] px-5 py-8 text-center text-sm text-[var(--muted)]">
        <SuperPricePilotLogo className="justify-center" />
        <p className="mt-3">A human-in-the-loop WebMCP prototype. All prices and orders are fictional.</p>
      </footer>
    </main>
  );
}

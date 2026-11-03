"use client";

import { use, useEffect, useState } from "react";
import { useRouter, notFound } from "next/navigation";
import { getProviderPublic, type GuestSafeProvider } from "@/lib/storage/repositories/providers";
import { setPendingBooking, getPendingBooking } from "@/lib/storage/session";
import { oneOffVisitPricePaise, weeklyPlanPricePaise, VISITS_PER_WEEK, WEEKLY_DISCOUNT_PCT, DEFAULT_VISIT_DURATION_HOURS } from "@/lib/business";
import { Card } from "@/components/ui/Card";

type Tab = "subscription" | "one_off";

// Public, guest-accessible — the AOV decision (Section 4, Step 3) happens
// here, before any account-creation friction exists. Writes only to
// session state (Guardrails: never a real booking record yet).
export default function BookingOptionsPage({ params }: { params: Promise<{ providerId: string }> }) {
  const { providerId } = use(params);
  const router = useRouter();
  const [provider, setProvider] = useState<GuestSafeProvider | null | undefined>(undefined);
  const [tab, setTab] = useState<Tab>("subscription"); // subscription tab pre-selected as default (Section 5.2)
  const [frequency, setFrequency] = useState<1 | 2 | 3>(VISITS_PER_WEEK as 1 | 2 | 3);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");

  useEffect(() => {
    getProviderPublic(providerId).then(setProvider);
    queueMicrotask(() => {
      const existing = getPendingBooking();
      if (existing?.providerId === providerId) {
        setTab(existing.type === "subscription" ? "subscription" : "one_off");
        if (existing.visitsPerWeek === 1 || existing.visitsPerWeek === 2 || existing.visitsPerWeek === 3) {
          setFrequency(existing.visitsPerWeek);
        }
        setDate(existing.scheduledDate);
        setTime(existing.scheduledTime);
      }
    });
  }, [providerId]);

  if (provider === null) notFound();
  if (provider === undefined) return null;

  const oneOffPrice = oneOffVisitPricePaise();
  // The 1x/2x/3x selector is real: the weekly total scales with the chosen
  // visit count (per-visit rate after the plan discount stays the same).
  const weeklyPrice = weeklyPlanPricePaise(undefined, frequency);
  const today = new Date().toISOString().slice(0, 10);

  function handleContinue() {
    if (!date) return;
    setPendingBooking({
      providerId,
      type: tab,
      frequency: tab === "subscription" ? "weekly" : undefined,
      visitsPerWeek: tab === "subscription" ? frequency : undefined,
      scheduledDate: date,
      scheduledTime: time,
      durationHours: DEFAULT_VISIT_DURATION_HOURS,
      amountPaise: tab === "subscription" ? weeklyPrice : oneOffPrice,
    });
    router.push(`/book/${providerId}/signup`);
  }

  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col gap-6 px-6 py-8">
      <div>
        <p className="text-xs font-semibold text-text-secondary">Step 1 of 4</p>
        <h1 className="text-xl font-semibold text-text-primary">Booking with {provider.name}</h1>
      </div>

      <div className="flex rounded-full border border-border p-1">
        <TabButton label="Weekly plan" active={tab === "subscription"} onClick={() => setTab("subscription")} />
        <TabButton label="One-off visit" active={tab === "one_off"} onClick={() => setTab("one_off")} />
      </div>

      {tab === "subscription" ? (
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                onClick={() => setFrequency(n as 1 | 2 | 3)}
                className={`min-h-tap flex-1 rounded-full border text-sm font-medium transition-colors ${frequency === n ? "border-accent bg-accent-tint text-accent-text" : "border-border text-text-secondary"}`}
              >
                {n}x per week
              </button>
            ))}
          </div>
          <label className="flex flex-col gap-1 text-sm text-text-secondary">
            Start date
            <input type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} className="min-h-tap rounded-md border border-border bg-surface px-4 text-base text-text-primary" />
          </label>
          <Card className="flex flex-col gap-1">
            <p className="price text-lg font-semibold text-text-primary">
              ₹{(weeklyPrice / frequency / 100).toFixed(0)}
              <span className="ml-1.5 text-sm font-normal text-text-secondary line-through">₹{(oneOffPrice / 100).toFixed(0)}</span>
              <span className="ml-1 text-sm font-normal text-text-secondary">/visit</span>
            </p>
            <p className="text-xs text-text-secondary">
              {frequency}x {DEFAULT_VISIT_DURATION_HOURS}h visits · ₹{(weeklyPrice / 100).toFixed(0)}/week total
            </p>
            <p className="text-xs font-medium text-verified">{WEEKLY_DISCOUNT_PCT}% less than booking the same visits one at a time</p>
          </Card>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex gap-3">
            <label className="flex flex-1 flex-col gap-1 text-sm text-text-secondary">
              Date
              <input type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} className="min-h-tap rounded-md border border-border bg-surface px-4 text-base text-text-primary" />
            </label>
            <label className="flex flex-1 flex-col gap-1 text-sm text-text-secondary">
              Time
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="min-h-tap rounded-md border border-border bg-surface px-4 text-base text-text-primary" />
            </label>
          </div>
          <Card>
            <p className="price text-lg font-semibold text-text-primary">₹{(oneOffPrice / 100).toFixed(0)} for this visit</p>
          </Card>
        </div>
      )}

      <Card className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">{provider.name} · {tab === "subscription" ? "Weekly plan" : "One-off visit"}</p>
        <p className="price text-sm font-semibold text-accent-text">
          {tab === "subscription" ? `₹${(weeklyPrice / 100).toFixed(0)}` : `₹${(oneOffPrice / 100).toFixed(0)}`}
        </p>
      </Card>

      <button onClick={handleContinue} disabled={!date} className="min-h-tap rounded-md bg-accent text-base font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50">
        Continue
      </button>
      <p className="text-center text-xs text-text-secondary">You&apos;ll confirm your details on the next step — nothing is booked yet.</p>
    </main>
  );
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`min-h-tap flex-1 rounded-full text-sm font-medium transition-colors ${active ? "bg-accent-tint text-accent-text" : "text-text-secondary"}`}
    >
      {label}
    </button>
  );
}

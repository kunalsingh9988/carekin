"use client";
import { useCallback, useState } from "react";
import Link from "next/link";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { useResource } from "@/lib/hooks/useResource";
import { getFamilyProfile } from "@/lib/storage/repositories/families";
import { getSubscription, listSubscriptionsForFamily } from "@/lib/storage/repositories/subscriptions";
import { getBooking, listBookingsForFamily } from "@/lib/storage/repositories/bookings";
import { getProvider } from "@/lib/storage/repositories/providers";
import { changePlanStatus, rescheduleBooking } from "@/lib/storage/repositories/workspace";
import type { SubscriptionStatus } from "@/lib/storage/types";
import { PageShell, Notice, DetailRows } from "./PageShell";
import { Button, LinkButton } from "@/components/ui/Button";
import { TextField } from "@/components/ui/FormField";
import { BookingStatusBadge } from "@/components/ui/BookingStatusBadge";

const money = (amount: number) => `₹${(amount / 100).toLocaleString("en-IN")}`;
const date = (value: string) => new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
const billingDate = (value: string) => new Date(value).toLocaleDateString("en-IN", { dateStyle: "medium" });

export function FamilyPlans() {
  const user = useRequireRole("family");
  const loader = useCallback(async () => {
    if (!user) return null;
    const family = await getFamilyProfile(user.id);
    const plans = family ? await listSubscriptionsForFamily(family.id) : [];
    return Promise.all(plans.map(async (plan) => ({ ...plan, provider: await getProvider(plan.provider_id) })));
  }, [user]);
  const { data, error, reload } = useResource(loader);
  const [filter, setFilter] = useState("all");
  const visible = data?.filter((p) => filter === "all" || p.status === filter);
  return <PageShell title="Your care, with a little continuity." description="See your care plans and keep track of the visits already connected to them." back={{ href: "/family", label: "Family dashboard" }} image="hero-family-care">
    <Notice>Demo plans only. There is no automatic billing or future visit generation.</Notice>
    <div className="flex flex-wrap gap-2" aria-label="Filter care plans">{["all", "active", "paused", "cancelled"].map((status) => <button key={status} aria-pressed={filter === status} onClick={() => setFilter(status)} className={`min-h-tap rounded-md px-4 text-sm capitalize ${filter === status ? "bg-accent-tint font-semibold text-accent-text" : "bg-surface-secondary text-text-secondary"}`}>{status}</button>)}</div>
    {error ? <><Notice error>{error}</Notice><Button onClick={reload}>Try again</Button></> : !data ? <Notice>Loading your care plans…</Notice> : !visible?.length ? <div className="rounded-lg bg-surface-secondary p-6 sm:p-10"><h2 className="text-2xl font-semibold">{data.length ? "No plans match this filter" : "A familiar face starts with a first visit."}</h2><p className="mt-3 max-w-prose text-text-secondary">{data.length ? "Choose another status to see your other plans." : "Choose a weekly plan during demo checkout. After simulated payment, your plan will appear here."}</p><LinkButton href="/search" className="mt-6">Explore care options</LinkButton></div> : <div className="divide-y divide-border">{visible.map((p) => <article key={p.id} className="grid gap-4 py-6 sm:grid-cols-[1fr_auto]"><div><p className="text-sm capitalize text-accent-text">{p.status} · {p.frequency} plan</p><h2 className="mt-2 text-2xl font-semibold">{p.provider?.name ?? "Your care provider"}</h2><p className="mt-2 text-sm text-text-secondary">{money(p.amount_paise)} per recorded billing cycle · Next recorded billing date: {billingDate(p.next_billing_date)}</p></div><LinkButton href={`/family/plans/${p.id}`} variant="secondary">Manage plan</LinkButton></article>)}</div>}
  </PageShell>;
}

export function FamilyPlanDetail({ id }: { id: string }) {
  const user = useRequireRole("family");
  const loader = useCallback(async () => {
    if (!user) return null;
    const [family, plan] = await Promise.all([getFamilyProfile(user.id), getSubscription(id)]);
    if (!family || !plan || family.id !== plan.family_id) return null;
    return { plan, provider: await getProvider(plan.provider_id), visits: (await listBookingsForFamily(family.id)).filter((b) => b.subscription_id === id) };
  }, [id, user]);
  const { data, error, reload } = useResource(loader);
  const [action, setAction] = useState<SubscriptionStatus | null>(null);
  const [busy, setBusy] = useState(false), [message, setMessage] = useState(""), [actionError, setActionError] = useState("");
  async function apply() {
    if (!user || !action) return;
    setBusy(true); setActionError("");
    try { await changePlanStatus(user.id, id, action); setMessage(`Demo plan is now ${action}. Existing visits and real payments are unchanged.`); setAction(null); reload(); }
    catch (e) { setActionError(e instanceof Error ? e.message : "Unable to update plan."); }
    finally { setBusy(false); }
  }
  return <PageShell title="Keep your care plan in step." description="Review the recorded plan and manage its demo status." back={{ href: "/family/plans", label: "My care plans" }}>
    {error ? <Notice error>{error}</Notice> : data === undefined ? <Notice>Loading care plan…</Notice> : !data ? <Notice error>This care plan is unavailable for your account.</Notice> : <>
      <Notice>Changing a plan updates this browser only. It does not stop or resume real billing, generate visits, cancel existing bookings or issue refunds.</Notice>
      <div className="grid gap-8 md:grid-cols-[1.2fr_0.8fr]"><section><h2 className="text-2xl font-semibold">{data.provider?.name ?? "Care plan"}</h2><DetailRows rows={[["Status", data.plan.status], ["Frequency", data.plan.frequency], ["Recorded cycle amount", money(data.plan.amount_paise)], ["Recorded next billing date", billingDate(data.plan.next_billing_date)]]} /><h2 className="mt-8 text-2xl font-semibold">Linked visits</h2>{data.visits.length ? data.visits.map((b) => <Link key={b.id} href={`/family/bookings/${b.id}`} className="flex min-h-tap flex-wrap items-center justify-between gap-3 border-b border-border py-4 text-sm"><span>{date(b.scheduled_at)}</span><BookingStatusBadge status={b.status} /></Link>) : <p className="mt-3 text-text-secondary">No visits are linked to this plan. The demo does not schedule future visits automatically.</p>}</section><aside className="flex flex-col gap-4 self-start rounded-lg bg-surface-secondary p-6"><h2 className="text-xl font-semibold">Plan controls</h2>{data.plan.status === "cancelled" ? <><p className="text-sm text-text-secondary">This plan is cancelled. Start a new booking to choose another plan.</p><LinkButton href="/search">Find care</LinkButton></> : action ? <><p className="text-sm leading-sm">{action === "cancelled" ? "Cancel this demo plan? This cannot be undone. Existing visits stay booked." : `${action === "paused" ? "Pause" : "Resume"} this demo plan? Existing visits stay unchanged.`}</p><Button disabled={busy} onClick={apply}>{busy ? "Saving…" : "Confirm plan change"}</Button><Button variant="secondary" disabled={busy} onClick={() => setAction(null)}>Keep current status</Button></> : <><Button onClick={() => setAction(data.plan.status === "active" ? "paused" : "active")}>{data.plan.status === "active" ? "Pause demo plan" : "Resume demo plan"}</Button><Button variant="secondary" onClick={() => setAction("cancelled")}>Cancel demo plan</Button></> }<Link href="/cancellation-policy" className="min-h-tap py-3 text-sm font-semibold text-accent-text">Cancellation information →</Link></aside></div>
      {message && <Notice>{message}</Notice>}{actionError && <Notice error>{actionError}</Notice>}
    </>}
  </PageShell>;
}

export function RescheduleVisit({ id }: { id: string }) {
  const user = useRequireRole("family");
  const loader = useCallback(async () => {
    if (!user) return null;
    const [family, booking] = await Promise.all([getFamilyProfile(user.id), getBooking(id)]);
    if (!family || !booking || family.id !== booking.family_id) return null;
    return { booking, provider: await getProvider(booking.provider_id), eligible: ["requested", "confirmed"].includes(booking.status) && Date.parse(booking.scheduled_at) > Date.now() };
  }, [id, user]);
  const { data, error, reload } = useResource(loader);
  const [busy, setBusy] = useState(false), [saved, setSaved] = useState(false), [actionError, setActionError] = useState("");
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!user) return;
    setBusy(true); setActionError("");
    const form = new FormData(event.currentTarget);
    try { await rescheduleBooking(user.id, id, `${form.get("date")}T${form.get("time")}`); setSaved(true); reload(); }
    catch (e) { setActionError(e instanceof Error ? e.message : "Unable to reschedule."); }
    finally { setBusy(false); }
  }
  const eligible = data?.eligible;
  return <PageShell title="Make room for a different time." description="Review your visit and choose a new date without changing the recorded duration or price." back={{ href: `/family/bookings/${id}`, label: "Booking details" }} image="family-peace">
    {error ? <Notice error>{error}</Notice> : data === undefined ? <Notice>Loading visit…</Notice> : !data ? <Notice error>This booking is unavailable for your account.</Notice> : <div className="grid gap-8 md:grid-cols-2"><section><h2 className="text-2xl font-semibold">{data.provider?.name ?? "Your provider"}</h2><DetailRows rows={[["Current visit", date(data.booking.scheduled_at)], ["Duration", `${data.booking.duration_hours} hours`], ["Recorded amount", money(data.booking.amount_paise)], ["Status", <BookingStatusBadge key="status" status={data.booking.status} />]]} /><Notice>Demo only. Saving changes the local booking immediately; no provider is contacted. Stored booking overlaps are checked, but real availability, fees and provider approval require the backend.</Notice></section>{saved ? <section className="flex flex-col gap-5"><h2 className="text-2xl font-semibold">Demo visit updated</h2><Notice>Your new recorded time is {date(data.booking.scheduled_at)}.</Notice><LinkButton href={`/family/bookings/${id}`}>View updated booking</LinkButton></section> : !eligible ? <Notice>This visit cannot be rescheduled. Only upcoming requested or confirmed visits are eligible.</Notice> : <form onSubmit={save} className="flex flex-col gap-5"><TextField label="New date" name="date" type="date" required /><TextField label="New time (your device’s local time)" name="time" type="time" required /><label className="flex items-start gap-3 text-sm leading-sm text-text-secondary"><input type="checkbox" required className="mt-1 h-5 w-5 shrink-0 accent-accent" />I understand this updates a demo booking only and does not confirm a real appointment.</label>{actionError && <Notice error>{actionError}</Notice>}<Button disabled={busy} type="submit">{busy ? "Saving…" : "Save demo schedule"}</Button></form>}</div>}
  </PageShell>;
}

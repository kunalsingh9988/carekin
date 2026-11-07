"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, ClipboardList, Flag, ShieldCheck, Wallet } from "lucide-react";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { listDisputes, listPendingVerifications } from "@/lib/storage/repositories/admin";
import { listAllBookings } from "@/lib/storage/repositories/bookings";
import { listAllPayouts } from "@/lib/storage/repositories/payouts";
import type { Booking, Dispute, Payout, Provider } from "@/lib/storage/types";
import { Card } from "@/components/ui/Card";
import { LoadError } from "@/components/ui/LoadError";
import { EmptyState } from "@/components/ui/EmptyState";

// Operations home: the two queues that need a human (verifications,
// disputes) plus the money line — bookings collected, commission kept,
// payouts still owed. Everything reads live from the stores.
export default function AdminDashboardPage() {
  const user = useRequireRole("admin");
  const [pendingProviders, setPendingProviders] = useState<Provider[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    Promise.all([listPendingVerifications(), listDisputes(), listAllBookings(), listAllPayouts()])
      .then(([p, d, b, pay]) => {
        setPendingProviders(p);
        setDisputes(d);
        setBookings(b);
        setPayouts(pay);
        setLoaded(true);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Unable to load operations data."));
  }, [user]);

  if (!user) return null;
  if (error) return <LoadError error={error} />;
  if (!loaded) return null;

  const openDisputes = disputes.filter((d) => d.status === "open");
  const activeBookings = bookings.filter((b) => b.status === "confirmed" || b.status === "in_progress");
  // Money collected = bookings the family actually paid for — everything
  // past the requested state except cancelled.
  const collected = bookings
    .filter((b) => ["confirmed", "in_progress", "completed", "disputed"].includes(b.status))
    .reduce((s, b) => s + b.amount_paise, 0);
  const commission = bookings
    .filter((b) => ["confirmed", "in_progress", "completed", "disputed"].includes(b.status))
    .reduce((s, b) => s + b.commission_paise, 0);
  const payoutsOwed = payouts.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount_paise, 0);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-8">
      <h1 className="text-2xl font-bold leading-2xl text-text-primary">Operations</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Pending verifications" value={String(pendingProviders.length)} href="/admin/verification-queue" urgent={pendingProviders.length > 0} />
        <StatCard label="Open disputes" value={String(openDisputes.length)} href="/admin/disputes" urgent={openDisputes.length > 0} />
        <StatCard label="Active bookings" value={String(activeBookings.length)} href="/admin/bookings" />
        <StatCard label="Payouts owed" value={`₹${(payoutsOwed / 100).toFixed(0)}`} href="/admin/payouts" urgent={payoutsOwed > 0} />
      </div>

      <Card className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">
          <span className="price font-semibold text-text-primary">₹{(collected / 100).toFixed(0)}</span> collected ·{" "}
          <span className="price font-semibold text-verified">₹{(commission / 100).toFixed(0)}</span> commission kept
        </p>
        <Link href="/admin/bookings" className="text-sm font-medium text-accent-text">All bookings →</Link>
      </Card>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-secondary">Verification queue</h2>
          <Link href="/admin/verification-queue" className="text-sm font-medium text-accent-text">Review →</Link>
        </div>
        {pendingProviders.length === 0 ? (
          <EmptyState icon={ShieldCheck} title="Queue is clear" body="New provider applications will show up here." />
        ) : (
          pendingProviders.slice(0, 3).map((p) => (
            <Card key={p.id} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-primary">{p.name}</p>
                <p className="text-xs text-text-secondary">{p.type === "caregiver" ? "Elder caregiver" : "Babysitter"}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-text-secondary" />
            </Card>
          ))
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-secondary">Open disputes</h2>
          <Link href="/admin/disputes" className="text-sm font-medium text-accent-text">Resolve →</Link>
        </div>
        {openDisputes.length === 0 ? (
          <EmptyState icon={Flag} title="No open disputes" body="Disputes raised by families or providers will show up here." />
        ) : (
          openDisputes.slice(0, 3).map((d) => (
            <Card key={d.id} className="flex items-center justify-between gap-3">
              <p className="text-sm text-text-primary">{d.reason}</p>
              <ChevronRight className="h-4 w-4 shrink-0 text-text-secondary" />
            </Card>
          ))
        )}
      </section>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <QuickLink href="/admin/verification-queue" icon={ShieldCheck} label="Verification" />
        <QuickLink href="/admin/bookings" icon={ClipboardList} label="Bookings" />
        <QuickLink href="/admin/disputes" icon={Flag} label="Disputes" />
        <QuickLink href="/admin/payouts" icon={Wallet} label="Payouts" />
      </div>
    </main>
  );
}

function StatCard({ label, value, href, urgent }: { label: string; value: string; href: string; urgent?: boolean }) {
  return (
    <Link href={href} className="flex flex-col gap-1 rounded-lg border border-border bg-surface p-4 transition-shadow hover:shadow-md">
      <p className="text-xs text-text-secondary">{label}</p>
      <p className={`price text-lg font-semibold ${urgent ? "text-accent-text" : "text-text-primary"}`}>{value}</p>
    </Link>
  );
}

function QuickLink({ href, icon: Icon, label }: { href: string; icon: typeof ShieldCheck; label: string }) {
  return (
    <Link href={href} className="flex items-center justify-between rounded-lg border border-border bg-surface p-3 transition-shadow hover:shadow-md">
      <span className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-accent" />
        <span className="text-sm font-medium text-text-primary">{label}</span>
      </span>
      <ChevronRight className="h-4 w-4 text-text-secondary" />
    </Link>
  );
}

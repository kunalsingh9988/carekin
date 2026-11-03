"use client";
import { backendEnabled } from "@/lib/backend/config";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BadgeCheck, CalendarCheck, ChevronRight, CircleAlert, Wallet } from "lucide-react";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { getMyProvider } from "@/lib/storage/repositories/providers";
import { listBookingsForProvider } from "@/lib/storage/repositories/bookings";
import { listPayoutsForProvider } from "@/lib/storage/repositories/payouts";
import { getPaymentForBooking } from "@/lib/storage/repositories/payments";
import { getFamilyProfileById, getCareRecipient } from "@/lib/storage/repositories/families";
import { getRatingSummary } from "@/lib/storage/repositories/reviews";
import type { Booking, CareRecipient, FamilyProfile, Payout, Provider } from "@/lib/storage/types";
import { Card } from "@/components/ui/Card";
import { ActiveCareEntry } from "@/components/care/ActiveCareEntry";
import { BookingStatusBadge } from "@/components/ui/BookingStatusBadge";
import { ProviderAvatar } from "@/components/ui/ProviderAvatar";

// Provider home (Section 5.2): what needs attention first — paid requests
// awaiting accept, the next confirmed visit — then earnings and quick
// links. Unverified providers get their status surfaced instead of stats.
export default function ProviderDashboardPage() {
  const user = useRequireRole("provider");
  const router = useRouter();
  const [provider, setProvider] = useState<Provider | null | undefined>(undefined);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [families, setFamilies] = useState<Record<string, FamilyProfile>>({});
  const [recipients, setRecipients] = useState<Record<string, CareRecipient>>({});
  const [paidRequests, setPaidRequests] = useState<Record<string, boolean>>({});
  const [rating, setRating] = useState<{ avg: number; count: number } | null>(null);

  useEffect(() => {
    if (!user) return;
    getMyProvider(user.id).then(async (p) => {
      if (!p) {
        // Signed in but never finished onboarding — pick the flow back up.
        router.replace("/provider/onboarding");
        return;
      }
      setProvider(p);
      const [list, payoutList, ratingSummary] = await Promise.all([
        listBookingsForProvider(p.id),
        listPayoutsForProvider(p.id),
        getRatingSummary(p.id),
      ]);
      setBookings(list);
      setPayouts(payoutList);
      setRating(ratingSummary);
      const familyEntries = await Promise.all(
        [...new Set(list.map((b) => b.family_id))].map(async (id) => [id, await getFamilyProfileById(id)] as const),
      );
      setFamilies(Object.fromEntries(familyEntries.filter(([, f]) => f) as [string, FamilyProfile][]));
      const recipientEntries = await Promise.all(
        [...new Set(list.map((b) => b.care_recipient_id))].map(async (id) => [id, await getCareRecipient(id)] as const),
      );
      setRecipients(Object.fromEntries(recipientEntries.filter(([, r]) => r) as [string, CareRecipient][]));
      // Same accept-gating rule as /provider/bookings — only paid requests
      // are actionable, so those are the ones worth surfacing here.
      const paidEntries = await Promise.all(
        list
          .filter((b) => b.status === "requested")
          .map(async (b) => [b.id, backendEnabled || (await getPaymentForBooking(b.id))?.status === "captured"] as const),
      );
      setPaidRequests(Object.fromEntries(paidEntries));
    });
  }, [user, router]);

  if (!user || provider === undefined) return null;
  if (!provider) return null; // redirect in flight

  const pendingRequests = bookings.filter((b) => b.status === "requested" && paidRequests[b.id]);
  const awaitingPayment = bookings.filter((b) => b.status === "requested" && !paidRequests[b.id]);
  const upcoming = bookings
    .filter((b) => b.status === "confirmed" || b.status === "in_progress")
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
  const completed = bookings.filter((b) => b.status === "completed");
  const nextVisit = upcoming[0] ?? null;
  const earned = payouts.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount_paise, 0);
  const pendingOut = payouts.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount_paise, 0);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-8">
      <div className="flex items-center gap-3">
        <ProviderAvatar name={provider.name} size="lg" />
        <div>
          <h1 className="text-2xl font-bold leading-2xl text-text-primary">Namaste, {provider.name.split(" ")[0]}.</h1>
          <p className="text-sm leading-sm text-text-secondary">{provider.type === "caregiver" ? "Elder caregiver" : "Babysitter"}</p>
        </div>
      </div>

      <ActiveCareEntry role="provider" />
      {/* Verification status — the gate for everything else. */}
      {provider.verification_status === "approved" ? (
        <Card className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BadgeCheck className="h-5 w-5 text-verified" />
            <p className="text-sm font-semibold text-text-primary">Verified</p>
            {rating && rating.count > 0 && (
              <p className="text-sm text-verified">★ {rating.avg.toFixed(1)} <span className="text-text-secondary">({rating.count} {rating.count === 1 ? "rating" : "ratings"})</span></p>
            )}
          </div>
          <Link href="/provider/verification-status" className="text-sm font-medium text-accent-text">View →</Link>
        </Card>
      ) : (
        <Link href="/provider/verification-status" className="flex items-center justify-between rounded-lg border border-border bg-surface-secondary p-4">
          <div className="flex items-center gap-2">
            <CircleAlert className="h-5 w-5 text-text-secondary" />
            <p className="text-sm font-semibold text-text-primary">
              {provider.verification_status === "pending" ? "Verification under review" : "Verification not approved"}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-text-secondary" />
        </Link>
      )}

      {/* Action first — paid requests awaiting accept/decline. */}
      {pendingRequests.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-text-secondary">Needs your response</h2>
          {pendingRequests.slice(0, 3).map((b) => (
            <Card key={b.id} className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium text-text-primary">{families[b.family_id]?.name ?? "Family"}</p>
                <p className="text-sm text-text-secondary">
                  {recipients[b.care_recipient_id]?.name} · {new Date(b.scheduled_at).toLocaleString()}
                </p>
              </div>
              <Link href="/provider/bookings" className="text-sm font-medium text-accent-text">Respond →</Link>
            </Card>
          ))}
        </section>
      )}

      {nextVisit && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-text-secondary">Next visit</h2>
          <Card className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-text-primary">{families[nextVisit.family_id]?.name ?? "Family"}</p>
                <p className="text-sm text-text-secondary">
                  {recipients[nextVisit.care_recipient_id]?.name} · {new Date(nextVisit.scheduled_at).toLocaleString()}
                </p>
              </div>
              <BookingStatusBadge status={nextVisit.status} />
            </div>
            <Link href={`/provider/bookings/${nextVisit.id}/chat`} className="text-sm font-medium text-accent-text">
              Open chat →
            </Link>
          </Card>
        </section>
      )}

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Upcoming visits" value={String(upcoming.length)} />
        <StatCard label="Completed visits" value={String(completed.length)} />
        <StatCard label="Paid out" value={`₹${(earned / 100).toFixed(0)}`} />
        <StatCard label="Pending payout" value={`₹${(pendingOut / 100).toFixed(0)}`} />
      </div>

      {awaitingPayment.length > 0 && (
        <p className="text-xs leading-xs text-text-secondary">
          {awaitingPayment.length} {awaitingPayment.length === 1 ? "request is" : "requests are"} waiting on the family&apos;s payment — nothing to do yet.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <QuickLink href="/provider/bookings" icon={CalendarCheck} label="Bookings" />
        <QuickLink href="/provider/payouts" icon={Wallet} label="Payouts" />
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="flex flex-col gap-1">
      <p className="text-xs text-text-secondary">{label}</p>
      <p className="price text-lg font-semibold text-text-primary">{value}</p>
    </Card>
  );
}

function QuickLink({ href, icon: Icon, label }: { href: string; icon: typeof CalendarCheck; label: string }) {
  return (
    <Link href={href} className="flex items-center justify-between rounded-lg border border-border bg-surface p-4 transition-shadow hover:shadow-md">
      <span className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-accent" />
        <span className="text-sm font-medium text-text-primary">{label}</span>
      </span>
      <ChevronRight className="h-4 w-4 text-text-secondary" />
    </Link>
  );
}

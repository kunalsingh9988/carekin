"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarX } from "lucide-react";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { getMyProvider } from "@/lib/storage/repositories/providers";
import { listBookingsForProvider, updateBookingStatus } from "@/lib/storage/repositories/bookings";
import { getFamilyProfileById, getCareRecipient } from "@/lib/storage/repositories/families";
import { ensurePayoutForCompletedBooking } from "@/lib/storage/repositories/payouts";
import { getPaymentForBooking } from "@/lib/storage/repositories/payments";
import { addNotification } from "@/lib/storage/repositories/notifications";
import type { Booking, CareRecipient, FamilyProfile, Provider } from "@/lib/storage/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { BookingStatusBadge } from "@/components/ui/BookingStatusBadge";

type Tab = "requests" | "upcoming" | "past";

export default function ProviderBookingsPage() {
  const user = useRequireRole("provider");
  const [provider, setProvider] = useState<Provider | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [families, setFamilies] = useState<Record<string, FamilyProfile>>({});
  const [recipients, setRecipients] = useState<Record<string, CareRecipient>>({});
  const [paidRequests, setPaidRequests] = useState<Record<string, boolean>>({});
  const [tab, setTab] = useState<Tab>("requests");

  async function load(providerId: string) {
    const list = await listBookingsForProvider(providerId);
    setBookings(list);
    const familyEntries = await Promise.all(
      [...new Set(list.map((b) => b.family_id))].map(async (id) => [id, await getFamilyProfileById(id)] as const),
    );
    setFamilies(Object.fromEntries(familyEntries.filter(([, f]) => f) as [string, FamilyProfile][]));
    const recipientEntries = await Promise.all(
      [...new Set(list.map((b) => b.care_recipient_id))].map(async (id) => [id, await getCareRecipient(id)] as const),
    );
    setRecipients(Object.fromEntries(recipientEntries.filter(([, r]) => r) as [string, CareRecipient][]));
    // `requested` means "created but not yet confirmed" — a provider may
    // only ACCEPT a request the family has actually paid for; unpaid
    // leftovers (abandoned checkout) can only be declined.
    const paidEntries = await Promise.all(
      list
        .filter((b) => b.status === "requested")
        .map(async (b) => [b.id, (await getPaymentForBooking(b.id))?.status === "captured"] as const),
    );
    setPaidRequests(Object.fromEntries(paidEntries));
  }

  useEffect(() => {
    if (!user) return;
    getMyProvider(user.id).then((p) => {
      setProvider(p);
      if (p) Promise.resolve().then(() => load(p.id));
    });
  }, [user]);

  if (!user) return null;
  if (!provider) {
    return (
      <main className="mx-auto flex max-w-md flex-1 items-center justify-center px-6 text-center">
        <p className="text-text-secondary">Finish setting up your provider profile first.</p>
      </main>
    );
  }

  async function respond(booking: Booking, accept: boolean) {
    await updateBookingStatus(booking.id, accept ? "confirmed" : "cancelled");
    await addNotification(
      families[booking.family_id]?.user_id ?? booking.family_id,
      accept ? "booking_confirmed" : "booking_cancelled",
      accept ? "Your booking was accepted — chat is now unlocked." : "Your booking was declined by the provider.",
    );
    await load(provider!.id);
  }

  async function markInProgress(booking: Booking) {
    await updateBookingStatus(booking.id, "in_progress");
    await load(provider!.id);
  }

  async function markCompleted(booking: Booking) {
    const updated = await updateBookingStatus(booking.id, "completed");
    await ensurePayoutForCompletedBooking(updated);
    await load(provider!.id);
  }

  const requests = bookings.filter((b) => b.status === "requested");
  const upcoming = bookings.filter((b) => b.status === "confirmed" || b.status === "in_progress");
  const past = bookings.filter((b) => ["completed", "cancelled", "disputed"].includes(b.status));
  const visible = tab === "requests" ? requests : tab === "upcoming" ? upcoming : past;

  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col gap-4 px-6 py-8">
      <h1 className="text-2xl font-semibold text-text-primary">Bookings</h1>

      <div className="flex gap-2 border-b border-border">
        <TabButton label={`Requests (${requests.length})`} active={tab === "requests"} onClick={() => setTab("requests")} />
        <TabButton label="Upcoming" active={tab === "upcoming"} onClick={() => setTab("upcoming")} />
        <TabButton label="Past" active={tab === "past"} onClick={() => setTab("past")} />
      </div>

      {visible.length === 0 ? (
        <EmptyState icon={CalendarX} title="Nothing here yet" body="New booking requests from families will show up here." />
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map((b) => (
            <Card key={b.id} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-text-primary">{families[b.family_id]?.name ?? "Family"}</p>
                  <p className="text-sm text-text-secondary">
                    {recipients[b.care_recipient_id]?.name} · {new Date(b.scheduled_at).toLocaleString()}
                  </p>
                </div>
                <BookingStatusBadge status={b.status} />
              </div>
              {tab === "requests" &&
                (paidRequests[b.id] ? (
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => respond(b, false)} className="flex-1">
                      Decline
                    </Button>
                    <Button onClick={() => respond(b, true)} className="flex-1">
                      Accept
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-text-secondary">Awaiting the family&apos;s payment — can&apos;t accept yet.</p>
                    <Button variant="secondary" onClick={() => respond(b, false)}>
                      Decline
                    </Button>
                  </div>
                ))}
              {tab === "upcoming" && (
                <div className="flex items-center justify-between gap-2">
                  <Link href={`/provider/bookings/${b.id}/chat`} className="text-sm font-medium text-accent-text">
                    Open chat →
                  </Link>
                  {b.status === "confirmed" ? (
                    <Button variant="secondary" onClick={() => markInProgress(b)}>
                      Start visit
                    </Button>
                  ) : (
                    <Button variant="secondary" onClick={() => markCompleted(b)}>
                      Mark completed
                    </Button>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`min-h-tap border-b-2 px-2 text-sm font-medium ${active ? "border-accent text-text-primary" : "border-transparent text-text-secondary"}`}
    >
      {label}
    </button>
  );
}

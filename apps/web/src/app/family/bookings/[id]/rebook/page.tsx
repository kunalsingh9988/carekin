"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { getBooking, createBooking, updateBookingStatus, linkBookingToSubscription } from "@/lib/storage/repositories/bookings";
import { createSubscription } from "@/lib/storage/repositories/subscriptions";
import { getProvider } from "@/lib/storage/repositories/providers";
import { getCareRecipient, getFamilyProfile } from "@/lib/storage/repositories/families";
import { simulatePayment } from "@/lib/storage/repositories/payments";
import { addNotification } from "@/lib/storage/repositories/notifications";
import type { Booking, CareRecipient, Provider } from "@/lib/storage/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

// The single highest-leverage AOV/LTV page in the site (Section 5.2) — one
// tap to confirm the same provider, care-recipient, and plan, skipping
// search, profile, and signup entirely for an already-authenticated
// returning family (Section 4, Shortcut path).
export default function RebookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const user = useRequireRole("family");
  const router = useRouter();

  const [original, setOriginal] = useState<Booking | null | undefined>(undefined);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [recipient, setRecipient] = useState<CareRecipient | null>(null);
  const [state, setState] = useState<"idle" | "processing" | "failed">("idle");
  const bookingIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user) return;
    getBooking(id).then(async (b) => {
      if (b) {
        // Ownership: this shortcut only works on YOUR past bookings.
        const family = await getFamilyProfile(user.id);
        if (!family || b.family_id !== family.id) {
          router.replace("/family/bookings");
          return;
        }
        setOriginal(b);
        getProvider(b.provider_id).then(setProvider);
        getCareRecipient(b.care_recipient_id).then(setRecipient);
      } else {
        setOriginal(null);
      }
    });
  }, [id, user, router]);

  if (!user || original === undefined) return null;
  if (original === null) return null; // redirected above
  if (!provider || !recipient) return null;

  function nextAvailableDate(): string {
    const d = new Date();
    d.setDate(d.getDate() + (original!.type === "subscription" ? 7 : 1));
    return d.toISOString();
  }

  async function handleConfirm() {
    setState("processing");
    // Create once, reuse on retry — a failed payment must never leave a
    // trail of duplicate `requested` bookings.
    if (!bookingIdRef.current) {
      const booking = await createBooking({
        familyId: original!.family_id,
        providerId: original!.provider_id,
        careRecipientId: original!.care_recipient_id,
        type: original!.type,
        scheduledAt: nextAvailableDate(),
        durationHours: original!.duration_hours,
        amountPaise: original!.amount_paise,
        subscriptionId: original!.subscription_id,
      });
      bookingIdRef.current = booking.id;
    }
    const payment = await simulatePayment(bookingIdRef.current, original!.amount_paise);
    if (payment.status === "captured") {
      const bookingId = bookingIdRef.current;
      await updateBookingStatus(bookingId, "confirmed");
      if (original!.type === "subscription" && !original!.subscription_id) {
        const next = new Date();
        next.setDate(next.getDate() + 7);
        const sub = await createSubscription({
          familyId: original!.family_id,
          providerId: original!.provider_id,
          frequency: "weekly",
          amountPaise: original!.amount_paise,
          nextBillingDate: next.toISOString(),
        });
        await linkBookingToSubscription(bookingId, sub.id);
      }
      await addNotification(user!.id, "booking_confirmed", `Your booking with ${provider!.name} is confirmed.`);
      router.push(`/family/bookings/${bookingId}`);
    } else {
      setState("failed");
    }
  }

  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col justify-center gap-6 px-6 py-16">
      <h1 className="text-2xl font-semibold text-text-primary">Book {provider.name} again?</h1>

      <Card className="flex flex-col gap-2 text-sm">
        <Row label="Provider" value={provider.name} />
        <Row label="For" value={recipient.name} />
        <Row label="Plan" value={original.type === "subscription" ? "Weekly plan" : "One-off visit"} />
        <Row label="Next available" value={new Date(nextAvailableDate()).toLocaleDateString()} />
        <Row label="Price" value={`₹${(original.amount_paise / 100).toFixed(0)}`} />
      </Card>

      {state === "failed" && <p className="text-center text-sm text-danger">Payment didn&apos;t go through — no charge was made, try again.</p>}

      {state === "processing" ? (
        <div className="flex justify-center py-2 text-text-secondary">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <Button onClick={handleConfirm} fullWidth>
          Confirm &amp; pay ₹{(original.amount_paise / 100).toFixed(0)}
        </Button>
      )}

      <Link href={`/book/${provider.id}`} className="text-center text-sm text-text-secondary underline">
        Change details first
      </Link>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-text-secondary">{label}</span>
      <span className="font-medium text-text-primary">{value}</span>
    </div>
  );
}

"use client";

import { use, useEffect, useState } from "react";
import { useRouter, notFound } from "next/navigation";
import { CircleAlert, Loader2 } from "lucide-react";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { getPendingBooking, clearPendingBooking } from "@/lib/storage/session";
import { getProviderPublic, type GuestSafeProvider } from "@/lib/storage/repositories/providers";
import { getFamilyProfile } from "@/lib/storage/repositories/families";
import { createBooking, updateBookingStatus, linkBookingToSubscription } from "@/lib/storage/repositories/bookings";
import { createSubscription } from "@/lib/storage/repositories/subscriptions";
import { simulatePayment } from "@/lib/storage/repositories/payments";
import { addNotification } from "@/lib/storage/repositories/notifications";
import { weeklyPlanPricePaise, WEEKLY_DISCOUNT_PCT, VISITS_PER_WEEK } from "@/lib/business";
import type { PendingBooking } from "@/lib/storage/types";
import { StepProgress } from "@/components/ui/StepProgress";
import { Card } from "@/components/ui/Card";

type PaymentState = "idle" | "processing" | "failed";

// Section 4, Step 6: collect payment, close the transaction. On success
// this is the ONLY place a real `bookings` record gets created — from
// pendingBooking, which is then cleared. On failure, pendingBooking stays
// intact so retrying doesn't lose anything (Guardrails).
export default function BookingPayPage({ params }: { params: Promise<{ providerId: string }> }) {
  const { providerId } = use(params);
  const router = useRouter();
  const user = useRequireRole("family");

  const [provider, setProvider] = useState<GuestSafeProvider | null | undefined>(undefined);
  const [pending, setPending] = useState<PendingBooking | null>(null);
  const [upgradedToWeekly, setUpgradedToWeekly] = useState(false);
  const [state, setState] = useState<PaymentState>("idle");

  // The booking row created on the FIRST pay attempt — retries reuse the
  // same id so a failed-then-retried payment can never duplicate into
  // orphan `requested` bookings.
  const [bookingId, setBookingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    getProviderPublic(providerId).then(setProvider);
    queueMicrotask(() => {
      const existing = getPendingBooking();
      // The pending selection must exist, have a care recipient (set at
      // /profile), and belong to THIS provider — a stale selection for a
      // different provider must not silently book the wrong person.
      if (!existing || !existing.careRecipientId || existing.providerId !== providerId) {
        router.replace(`/book/${providerId}/profile`);
        return;
      }
      setPending(existing);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerId]);

  if (provider === null) notFound();
  if (!user || provider === undefined || !pending) return null;

  const visitsPerWeek = pending.visitsPerWeek ?? VISITS_PER_WEEK;
  const weeklyPrice = weeklyPlanPricePaise(pending.durationHours, visitsPerWeek);
  const effectiveAmount = upgradedToWeekly ? weeklyPrice : pending.amountPaise;
  const effectiveType = upgradedToWeekly ? "subscription" : pending.type;

  async function handlePay() {
    setState("processing");
    const family = await getFamilyProfile(user!.id);
    if (!family) {
      setState("idle");
      return;
    }

    let currentBookingId = bookingId;
    if (!currentBookingId) {
      const booking = await createBooking({
        familyId: family.id,
        providerId,
        careRecipientId: pending!.careRecipientId!,
        type: effectiveType,
        scheduledAt: new Date(`${pending!.scheduledDate}T${pending!.scheduledTime || "10:00"}:00`).toISOString(),
        durationHours: pending!.durationHours,
        amountPaise: effectiveAmount,
      });
      currentBookingId = booking.id;
      setBookingId(booking.id);
    }

    const payment = await simulatePayment(currentBookingId, effectiveAmount);
    if (payment.status === "captured") {
      await updateBookingStatus(currentBookingId, "confirmed");
      if (effectiveType === "subscription") {
        // A "subscription"-type booking needs a real subscriptions row
        // behind it — created here, on payment success, and linked back.
        const next = new Date(`${pending!.scheduledDate}T${pending!.scheduledTime || "10:00"}:00`);
        next.setDate(next.getDate() + 7);
        const subscription = await createSubscription({
          familyId: family.id,
          providerId,
          frequency: pending!.frequency ?? "weekly",
          amountPaise: effectiveAmount,
          nextBillingDate: next.toISOString(),
        });
        await linkBookingToSubscription(currentBookingId, subscription.id);
      }
      await addNotification(user!.id, "booking_confirmed", "Your booking is confirmed — chat is now unlocked.");
      clearPendingBooking();
      router.push(`/book/${providerId}/confirmed?bookingId=${currentBookingId}`);
    } else {
      // Booking stays in `requested` status and is REUSED on retry — the
      // same row, never a duplicate (Guardrails: pendingBooking untouched).
      setState("failed");
    }
  }

  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col gap-6 px-6 py-8">
      <StepProgress step={4} total={4} label="Payment" />

      <Card className="flex flex-col gap-2">
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">{provider.name}</span>
          <span className="text-text-primary">{effectiveType === "subscription" ? `Weekly plan · ${visitsPerWeek}x/week` : "One-off visit"}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">{effectiveType === "subscription" ? "Weekly total" : "Visit price"}</span>
          <span className="price text-text-primary">₹{(effectiveAmount / 100).toFixed(0)}</span>
        </div>
        <div className="mt-2 flex justify-between border-t border-border pt-2 text-base font-semibold">
          <span className="text-text-primary">Total</span>
          <span className="price text-text-primary">₹{(effectiveAmount / 100).toFixed(0)}</span>
        </div>
      </Card>

      {/* Once a booking row exists (first pay attempt), the plan is locked —
          switching mid-retry would charge a different amount than the row. */}
      {pending.type === "one_off" && !upgradedToWeekly && !bookingId && (
        <Card className="flex items-center justify-between gap-3">
          <p className="text-sm text-text-primary">Switch to a weekly plan and save {WEEKLY_DISCOUNT_PCT}%?</p>
          <button onClick={() => setUpgradedToWeekly(true)} className="min-h-tap shrink-0 rounded-full border border-accent px-4 text-xs font-semibold text-accent-text transition-colors hover:bg-accent-tint">
            Switch
          </button>
        </Card>
      )}
      {upgradedToWeekly && <p className="text-xs text-text-secondary">You can change this anytime after booking too.</p>}

      <p className="demo-note rounded-md px-3 py-2 text-xs">
        Payments are processed securely. Nothing is charged until you tap &quot;Pay.&quot; (Demo mode: simulated,
        ~10% of attempts fail on purpose so the retry flow is reachable.)
      </p>

      {state === "idle" && (
        <button onClick={handlePay} className="price min-h-tap rounded-md bg-accent text-base font-semibold text-white transition-colors hover:bg-accent-text">
          {`Pay ₹${(effectiveAmount / 100).toFixed(0)} & confirm booking`}
        </button>
      )}

      {state === "processing" && (
        <div className="flex flex-col items-center gap-2 py-4 text-text-secondary">
          <Loader2 className="h-6 w-6 animate-spin" />
          Processing payment…
        </div>
      )}

      {state === "failed" && (
        <div className="flex flex-col items-center gap-3 py-4">
          <CircleAlert className="h-8 w-8 text-danger" />
          <p className="text-center text-sm text-text-primary">
            Your payment didn&apos;t go through. No charge was made — please try again.
          </p>
          <button onClick={handlePay} className="min-h-tap w-full rounded-md bg-accent text-base font-semibold text-white transition-colors hover:bg-accent-text">
            Try again
          </button>
        </div>
      )}
    </main>
  );
}

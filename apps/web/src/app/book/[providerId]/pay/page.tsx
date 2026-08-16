"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleAlert, Loader2 } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getPendingBooking, clearPendingBooking } from "@/lib/storage/session";
import { getProviderPublic, type GuestSafeProvider } from "@/lib/storage/repositories/providers";
import { getFamilyProfile } from "@/lib/storage/repositories/families";
import { createBooking, updateBookingStatus } from "@/lib/storage/repositories/bookings";
import { simulatePayment } from "@/lib/storage/repositories/payments";
import { addNotification } from "@/lib/storage/repositories/notifications";
import { weeklyPlanPricePaise, WEEKLY_DISCOUNT_PCT } from "@/lib/business";
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
  const user = getCurrentUser();

  const [provider, setProvider] = useState<GuestSafeProvider | null>(null);
  const [pending, setPending] = useState<PendingBooking | null>(null);
  const [upgradedToWeekly, setUpgradedToWeekly] = useState(false);
  const [state, setState] = useState<PaymentState>("idle");

  useEffect(() => {
    if (!user) {
      router.replace(`/book/${providerId}`);
      return;
    }
    getProviderPublic(providerId).then(setProvider);
    const existing = getPendingBooking();
    if (!existing || !existing.careRecipientId) {
      router.replace(`/book/${providerId}/profile`);
      return;
    }
    setPending(existing);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerId]);

  if (!user || !provider || !pending) return null;

  const weeklyPrice = weeklyPlanPricePaise(pending.durationHours);
  const effectiveAmount = upgradedToWeekly ? weeklyPrice : pending.amountPaise;
  const effectiveType = upgradedToWeekly ? "subscription" : pending.type;

  async function handlePay() {
    setState("processing");
    const family = await getFamilyProfile(user!.id);
    if (!family) {
      setState("idle");
      return;
    }

    const booking = await createBooking({
      familyId: family.id,
      providerId,
      careRecipientId: pending!.careRecipientId!,
      type: effectiveType,
      scheduledAt: new Date(`${pending!.scheduledDate}T${pending!.scheduledTime || "10:00"}:00`).toISOString(),
      durationHours: pending!.durationHours,
      amountPaise: effectiveAmount,
    });

    const payment = await simulatePayment(booking.id, effectiveAmount);
    if (payment.status === "captured") {
      await updateBookingStatus(booking.id, "confirmed");
      await addNotification(user!.id, "booking_confirmed", "Your booking is confirmed — chat is now unlocked.");
      clearPendingBooking();
      router.push(`/book/${providerId}/confirmed?bookingId=${booking.id}`);
    } else {
      // Booking stays in `requested` status, recoverable — pendingBooking
      // is untouched so retry has everything it needs (Guardrails).
      setState("failed");
    }
  }

  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col gap-6 px-6 py-8">
      <StepProgress step={4} total={4} label="Payment" />

      <Card className="flex flex-col gap-2">
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">{provider.name}</span>
          <span className="text-text-primary">{effectiveType === "subscription" ? "Weekly plan" : "One-off visit"}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">Visit price</span>
          <span className="text-text-primary">₹{(effectiveAmount / 100).toFixed(0)}</span>
        </div>
        <div className="mt-2 flex justify-between border-t border-border pt-2 text-base font-semibold">
          <span className="text-text-primary">Total</span>
          <span className="text-text-primary">₹{(effectiveAmount / 100).toFixed(0)}</span>
        </div>
      </Card>

      {pending.type === "one_off" && !upgradedToWeekly && (
        <Card className="flex items-center justify-between gap-3">
          <p className="text-sm text-text-primary">Switch to a weekly plan and save {WEEKLY_DISCOUNT_PCT}%?</p>
          <button onClick={() => setUpgradedToWeekly(true)} className="min-h-tap shrink-0 rounded-md border border-accent px-3 text-xs font-semibold text-accent-text">
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
        <button onClick={handlePay} className="min-h-tap rounded-md bg-accent text-base font-semibold text-white">
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
            Your payment didn&apos;t go through. No charge was made — please try again or use a different payment
            method.
          </p>
          <button onClick={handlePay} className="min-h-tap w-full rounded-md bg-accent text-base font-semibold text-white">
            Try a different payment method
          </button>
        </div>
      )}
    </main>
  );
}

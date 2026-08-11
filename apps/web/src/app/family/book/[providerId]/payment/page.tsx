"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CircleAlert, CircleCheck, Loader2 } from "lucide-react";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { getBooking, updateBookingStatus } from "@/lib/storage/repositories/bookings";
import { simulatePayment } from "@/lib/storage/repositories/payments";
import { addNotification } from "@/lib/storage/repositories/notifications";
import type { Booking } from "@/lib/storage/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type PaymentState = "idle" | "processing" | "succeeded" | "failed";

// Real-world: Razorpay/Cashfree checkout. Prototype: simulatePayment()
// resolves after a fake delay, ~90% success / ~10% failure, so this
// failure branch is reachable during demos, not just theoretical
// (Guardrails, Section 8).
function PaymentForm() {
  const user = useRequireRole("family");
  const router = useRouter();
  const params = useSearchParams();
  const bookingId = params.get("bookingId") ?? "";

  const [booking, setBooking] = useState<Booking | null>(null);
  const [state, setState] = useState<PaymentState>("idle");

  useEffect(() => {
    getBooking(bookingId).then(setBooking);
  }, [bookingId]);

  if (!user) return null;

  async function handlePay() {
    if (!booking) return;
    setState("processing");
    const payment = await simulatePayment(booking.id, booking.amount_paise);
    if (payment.status === "captured") {
      await updateBookingStatus(booking.id, "confirmed");
      await addNotification(user!.id, "booking_confirmed", "Your booking is confirmed — chat is now unlocked.");
      setState("succeeded");
    } else {
      setState("failed");
    }
  }

  if (!booking) {
    return (
      <main className="mx-auto flex max-w-md flex-1 items-center justify-center px-6">
        <p className="text-text-secondary">Loading booking…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col justify-center gap-6 px-6 py-16">
      <h1 className="text-2xl font-semibold text-text-primary">Payment</h1>

      <Card className="flex items-center justify-between">
        <span className="text-sm text-text-secondary">Amount due</span>
        <span className="text-2xl font-semibold text-text-primary">₹{(booking.amount_paise / 100).toFixed(0)}</span>
      </Card>

      <p className="demo-note rounded-md px-3 py-2 text-xs">
        Demo mode: this payment is simulated, no real gateway is called (~10% of attempts fail on purpose so the
        retry flow is reachable).
      </p>

      {state === "idle" && (
        <Button onClick={handlePay} fullWidth>
          Pay ₹{(booking.amount_paise / 100).toFixed(0)}
        </Button>
      )}

      {state === "processing" && (
        <div className="flex flex-col items-center gap-2 py-4 text-text-secondary">
          <Loader2 className="h-6 w-6 animate-spin" />
          Processing payment…
        </div>
      )}

      {state === "succeeded" && (
        <div className="flex flex-col items-center gap-3 py-4">
          <CircleCheck className="h-10 w-10 text-success-generic" />
          <p className="font-medium text-text-primary">Payment successful</p>
          <Button onClick={() => router.push(`/family/bookings/${booking.id}`)} fullWidth>
            View booking
          </Button>
        </div>
      )}

      {state === "failed" && (
        <div className="flex flex-col items-center gap-3 py-4">
          <CircleAlert className="h-10 w-10 text-danger" />
          <p className="font-medium text-text-primary">Payment failed</p>
          <p className="text-center text-sm text-text-secondary">Your card wasn&apos;t charged. Try again, or use a different payment method.</p>
          <Button onClick={handlePay} fullWidth>
            Retry payment
          </Button>
        </div>
      )}
    </main>
  );
}

export default function PaymentPage() {
  return (
    <Suspense>
      <PaymentForm />
    </Suspense>
  );
}

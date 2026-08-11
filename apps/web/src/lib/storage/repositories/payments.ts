import { get, newId, set } from "../client";
import type { Payment } from "../types";

const KEY = "payments";
const FAKE_DELAY_MS = 1500;
const SUCCESS_RATE = 0.9;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Real-world: Razorpay/Cashfree checkout. Prototype: a fake delay and a
// randomized ~10% failure rate, so the payment-failure UI is actually
// reachable during demos instead of purely theoretical (Guardrails,
// Section 8).
export async function simulatePayment(bookingId: string, amountPaise: number): Promise<Payment> {
  await delay(FAKE_DELAY_MS);

  const succeeded = Math.random() < SUCCESS_RATE;
  const now = new Date().toISOString();
  const all = get<Payment[]>(KEY, []);
  const created: Payment = {
    id: newId(),
    booking_id: bookingId,
    status: succeeded ? "captured" : "failed",
    amount_paise: amountPaise,
    captured_at: succeeded ? now : null,
    created_at: now,
    updated_at: now,
  };
  set(KEY, [...all, created]);
  return created;
}

export async function getPaymentForBooking(bookingId: string): Promise<Payment | null> {
  const all = get<Payment[]>(KEY, []);
  return all.filter((p) => p.booking_id === bookingId).sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null;
}

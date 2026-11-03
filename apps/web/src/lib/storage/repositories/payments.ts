import { backendEnabled } from "@/lib/backend/config";
import { remote } from "@/lib/backend/browser";
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
 async function demo_simulatePayment(bookingId: string, amountPaise: number): Promise<Payment> {
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

 async function demo_getPaymentForBooking(bookingId: string): Promise<Payment | null> {
  const all = get<Payment[]>(KEY, []);
  return all.filter((p) => p.booking_id === bookingId).sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null;
}

// Backend adapters
export const simulatePayment: typeof demo_simulatePayment = (...args) => backendEnabled ? remote("payments.simulatePayment", args) : demo_simulatePayment(...args);
export const getPaymentForBooking: typeof demo_getPaymentForBooking = (...args) => backendEnabled ? remote("payments.getPaymentForBooking", args) : demo_getPaymentForBooking(...args);

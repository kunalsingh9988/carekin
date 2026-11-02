import { get, newId, set } from "../client";
import type { Booking, Payout } from "../types";
import { listAllBookings } from "./bookings";

const KEY = "payouts";

export async function listPayoutsForProvider(providerId: string): Promise<Payout[]> {
  const all = get<Payout[]>(KEY, []);
  return all.filter((p) => p.provider_id === providerId).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function listAllPayouts(): Promise<Payout[]> {
  return get<Payout[]>(KEY, []).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

// Creates a `pending` payout the moment a booking completes, if one
// doesn't already exist — mirrors the real schema's payouts table being
// populated on booking completion (Guardrails, Section 8).
export async function ensurePayoutForCompletedBooking(booking: Booking): Promise<Payout | null> {
  if (booking.status !== "completed") return null;
  const all = get<Payout[]>(KEY, []);
  if (all.some((p) => p.booking_id === booking.id)) return null;

  const created: Payout = {
    id: newId(),
    provider_id: booking.provider_id,
    booking_id: booking.id,
    amount_paise: booking.amount_paise - booking.commission_paise,
    status: "pending",
    created_at: new Date().toISOString(),
    paid_at: null,
  };
  set(KEY, [...all, created]);
  return created;
}

// Admin action: flips every pending payout to paid, one simulated batch run.
export async function simulatePayoutRun(): Promise<Payout[]> {
  const all = get<Payout[]>(KEY, []);
  const now = new Date().toISOString();
  const updated = all.map((p): Payout => (p.status === "pending" ? { ...p, status: "paid", paid_at: now } : p));
  set(KEY, updated);
  return updated;
}

// Best-effort backfill so payouts exist for bookings seeded/completed
// outside the normal booking-completion path.
export async function backfillPayoutsFromCompletedBookings(): Promise<void> {
  const bookings = await listAllBookings();
  for (const booking of bookings) {
    await ensurePayoutForCompletedBooking(booking);
  }
}

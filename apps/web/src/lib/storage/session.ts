// Guest-only booking selection, held OUTSIDE the repository layer on
// purpose — this is not a domain record until a real `bookings` row is
// created at payment time. Expires after ~24h so a stale guest selection
// from days ago never silently resurfaces (Guardrails, Section 7).
import { get, set, remove } from "./client";
import type { PendingBooking } from "./types";

const KEY = "pendingBooking";
const EXPIRY_MS = 24 * 60 * 60 * 1000;

export function getPendingBooking(): PendingBooking | null {
  const value = get<PendingBooking | null>(KEY, null);
  if (!value) return null;
  if (Date.now() - new Date(value.createdAt).getTime() > EXPIRY_MS) {
    remove(KEY);
    return null;
  }
  return value;
}

// Merges into whatever's already there so each funnel step (plan choice,
// then care-recipient at profile) can contribute without clobbering the
// rest — this is the exact mechanism that lets Step 4 (signup) "read but
// not clear" the selection made back in Step 3.
export function setPendingBooking(partial: Partial<PendingBooking>): PendingBooking {
  const existing = getPendingBooking();
  const merged = { ...existing, ...partial, createdAt: existing?.createdAt ?? new Date().toISOString() } as PendingBooking;
  set(KEY, merged);
  return merged;
}

export function clearPendingBooking(): void {
  remove(KEY);
}

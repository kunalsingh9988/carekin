// Guest-only booking selection, held OUTSIDE the repository layer on
// purpose — this is not a domain record until a real `bookings` row is
// created at payment time. Expires after ~24h so a stale guest selection
// from days ago never silently resurfaces (Guardrails, Section 7).
import { get, set, remove } from "./client";
import type { PendingBooking } from "./types";

const KEY = "pendingBooking";
const REFERRAL_KEY = "pendingReferral";
const CHILD_KEY = "pendingChildRecipient";
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

// Referral code captured on landing (`/search?ref=…`). Session state, not
// URL state, because the code must survive the whole guest → provider →
// book → signup → profile journey; URLs don't carry params across plain
// <Link> navigations. Consumed (and cleared) when the new family's profile
// is created at /book/[providerId]/profile.
export interface PendingReferral {
  code: string;
  createdAt: string;
}

export function setPendingReferral(code: string): void {
  const existing = getPendingReferral();
  if (existing?.code === code) return;
  set(REFERRAL_KEY, { code, createdAt: new Date().toISOString() });
}

export function getPendingReferral(): PendingReferral | null {
  const value = get<PendingReferral | null>(REFERRAL_KEY, null);
  if (!value) return null;
  if (Date.now() - new Date(value.createdAt).getTime() > EXPIRY_MS) {
    remove(REFERRAL_KEY);
    return null;
  }
  return value;
}

export function clearPendingReferral(): void {
  remove(REFERRAL_KEY);
}

// Child care-recipient details between /profile and /consent — kept in
// session state rather than the URL so a minor's name never sits in the
// address bar or browser history (PII hygiene, DPDP).
export interface PendingChildRecipient {
  familyId: string;
  name: string;
  notes: string;
}

export function setPendingChildRecipient(value: PendingChildRecipient): void {
  set(CHILD_KEY, value);
}

export function getPendingChildRecipient(): PendingChildRecipient | null {
  return get<PendingChildRecipient | null>(CHILD_KEY, null);
}

export function clearPendingChildRecipient(): void {
  remove(CHILD_KEY);
}

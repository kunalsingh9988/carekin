import { get, newId, set } from "../client";
import type { Subscription, SubscriptionFrequency } from "../types";

const KEY = "subscriptions";

// A `subscription` booking is only meaningful if a `subscriptions` row
// exists behind it — created at the same moment the first paid booking is
// confirmed (Section 6.6). Cancellation/pause mechanics are out of scope
// for the prototype; the record exists so bookings have something real to
// reference via `subscription_id`.
export async function createSubscription(input: {
  familyId: string;
  providerId: string;
  frequency: SubscriptionFrequency;
  amountPaise: number;
  nextBillingDate: string;
}): Promise<Subscription> {
  const all = get<Subscription[]>(KEY, []);
  const now = new Date().toISOString();
  const created: Subscription = {
    id: newId(),
    family_id: input.familyId,
    provider_id: input.providerId,
    frequency: input.frequency,
    amount_paise: input.amountPaise,
    next_billing_date: input.nextBillingDate,
    status: "active",
    created_at: now,
    updated_at: now,
  };
  set(KEY, [...all, created]);
  return created;
}

export async function getSubscription(id: string): Promise<Subscription | null> {
  const all = get<Subscription[]>(KEY, []);
  return all.find((s) => s.id === id) ?? null;
}

export async function listSubscriptionsForFamily(familyId: string): Promise<Subscription[]> {
  const all = get<Subscription[]>(KEY, []);
  return all.filter((s) => s.family_id === familyId);
}

export async function cancelSubscription(id: string): Promise<Subscription> {
  const all = get<Subscription[]>(KEY, []);
  const existing = all.find((s) => s.id === id);
  if (!existing) throw new Error(`Subscription ${id} not found`);
  const updated: Subscription = { ...existing, status: "cancelled", updated_at: new Date().toISOString() };
  set(
    KEY,
    all.map((s) => (s.id === id ? updated : s)),
  );
  return updated;
}

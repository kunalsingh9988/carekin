import { backendEnabled } from "@/lib/backend/config";
import { remote } from "@/lib/backend/browser";
import { get, newId, set } from "../client";
import type { Subscription, SubscriptionFrequency } from "../types";

const KEY = "subscriptions";

// A `subscription` booking is only meaningful if a `subscriptions` row
// exists behind it — created at the same moment the first paid booking is
// confirmed (Section 6.6). Cancellation/pause mechanics are out of scope
// for the prototype; the record exists so bookings have something real to
// reference via `subscription_id`.
 async function demo_createSubscription(input: {
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

 async function demo_getSubscription(id: string): Promise<Subscription | null> {
  const all = get<Subscription[]>(KEY, []);
  return all.find((s) => s.id === id) ?? null;
}

 async function demo_listSubscriptionsForFamily(familyId: string): Promise<Subscription[]> {
  const all = get<Subscription[]>(KEY, []);
  return all.filter((s) => s.family_id === familyId);
}

 async function demo_cancelSubscription(id: string): Promise<Subscription> {
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

// Backend adapters
export const createSubscription: typeof demo_createSubscription = (...args) => backendEnabled ? remote("subscriptions.createSubscription", args) : demo_createSubscription(...args);
export const getSubscription: typeof demo_getSubscription = (...args) => backendEnabled ? remote("subscriptions.getSubscription", args) : demo_getSubscription(...args);
export const listSubscriptionsForFamily: typeof demo_listSubscriptionsForFamily = (...args) => backendEnabled ? remote("subscriptions.listSubscriptionsForFamily", args) : demo_listSubscriptionsForFamily(...args);
export const cancelSubscription: typeof demo_cancelSubscription = (...args) => backendEnabled ? remote("subscriptions.cancelSubscription", args) : demo_cancelSubscription(...args);

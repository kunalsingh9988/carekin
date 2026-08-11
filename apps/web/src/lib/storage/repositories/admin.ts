import { get, newId, set } from "../client";
import type { Dispute, Provider, VerificationReview } from "../types";

const PROVIDERS_KEY = "providers";
const REVIEWS_KEY = "verificationReviews";
const DISPUTES_KEY = "disputes";

export async function listPendingVerifications(): Promise<Provider[]> {
  const all = get<Provider[]>(PROVIDERS_KEY, []);
  return all.filter((p) => p.verification_status === "pending").sort((a, b) => a.created_at.localeCompare(b.created_at));
}

async function reviewProvider(
  id: string,
  toStatus: "approved" | "rejected",
  reason: string | null,
  reviewedBy: string,
): Promise<Provider> {
  const all = get<Provider[]>(PROVIDERS_KEY, []);
  const existing = all.find((p) => p.id === id);
  if (!existing) throw new Error(`Provider ${id} not found`);
  if (existing.verification_status !== "pending") {
    throw new Error(`Provider ${id} is already ${existing.verification_status}, not pending`);
  }

  const updated: Provider = { ...existing, verification_status: toStatus, updated_at: new Date().toISOString() };
  set(
    PROVIDERS_KEY,
    all.map((p) => (p.id === id ? updated : p)),
  );

  const reviews = get<VerificationReview[]>(REVIEWS_KEY, []);
  const review: VerificationReview = {
    id: newId(),
    provider_id: id,
    from_status: "pending",
    to_status: toStatus,
    reviewed_by: reviewedBy,
    reason,
    created_at: new Date().toISOString(),
  };
  set(REVIEWS_KEY, [...reviews, review]);

  return updated;
}

// Same "only PENDING can transition, human admin always decides" rule as
// the real backend's review_verification() RPC — replicated as a business
// rule here since there's no RLS/security-definer function to enforce it
// (Guardrails, Section 2/5).
export async function approveProvider(id: string, reviewedBy: string): Promise<Provider> {
  return reviewProvider(id, "approved", null, reviewedBy);
}

export async function rejectProvider(id: string, reason: string, reviewedBy: string): Promise<Provider> {
  return reviewProvider(id, "rejected", reason, reviewedBy);
}

export async function listDisputes(): Promise<Dispute[]> {
  return get<Dispute[]>(DISPUTES_KEY, []).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function raiseDispute(bookingId: string, raisedBy: string, reason: string): Promise<Dispute> {
  const all = get<Dispute[]>(DISPUTES_KEY, []);
  const created: Dispute = {
    id: newId(),
    booking_id: bookingId,
    raised_by: raisedBy,
    reason,
    status: "open",
    resolution_notes: null,
    created_at: new Date().toISOString(),
    resolved_at: null,
  };
  set(DISPUTES_KEY, [...all, created]);
  return created;
}

export async function resolveDispute(id: string, resolutionNotes: string): Promise<Dispute> {
  const all = get<Dispute[]>(DISPUTES_KEY, []);
  const existing = all.find((d) => d.id === id);
  if (!existing) throw new Error(`Dispute ${id} not found`);
  const updated: Dispute = {
    ...existing,
    status: "resolved",
    resolution_notes: resolutionNotes,
    resolved_at: new Date().toISOString(),
  };
  set(
    DISPUTES_KEY,
    all.map((d) => (d.id === id ? updated : d)),
  );
  return updated;
}

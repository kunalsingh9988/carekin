import { get, newId, set } from "../client";
import type { Referral } from "../types";

const KEY = "referrals";
const REFERRAL_BONUS_PAISE = 20000; // ₹200, matches the "₹[X] off" copy

// Deterministic from the family id — no separate code-generation table
// needed for a prototype. Real backend would likely want a shorter,
// collision-checked code, but this is fine for a shareable demo link.
export function getReferralCode(familyId: string): string {
  return familyId.replace(/-/g, "").slice(0, 8).toUpperCase();
}

export async function findFamilyIdByReferralCode(familyIds: string[], code: string): Promise<string | null> {
  return familyIds.find((id) => getReferralCode(id) === code.toUpperCase()) ?? null;
}

export async function recordReferral(referrerFamilyId: string, referredFamilyId: string): Promise<Referral | null> {
  if (referrerFamilyId === referredFamilyId) return null;
  const all = get<Referral[]>(KEY, []);
  if (all.some((r) => r.referred_family_id === referredFamilyId)) return null; // one referral credit per new family
  const created: Referral = {
    id: newId(),
    referrer_family_id: referrerFamilyId,
    referred_family_id: referredFamilyId,
    created_at: new Date().toISOString(),
  };
  set(KEY, [...all, created]);
  return created;
}

export async function listReferralStats(
  familyId: string,
): Promise<{ referredCount: number; completedCount: number; earnedPaise: number }> {
  const all = get<Referral[]>(KEY, []);
  const mine = all.filter((r) => r.referrer_family_id === familyId);
  // "Completed" would really mean the referred family's first booking paid
  // out — simplified here to "referral exists" since that's already gated
  // on a completed signup in this prototype's funnel.
  return { referredCount: mine.length, completedCount: mine.length, earnedPaise: mine.length * REFERRAL_BONUS_PAISE };
}

export { REFERRAL_BONUS_PAISE };

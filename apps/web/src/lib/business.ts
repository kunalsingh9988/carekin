// Framework-agnostic business rules — the prototype's stand-in for
// packages/core, kept local per this build's own guardrail against
// building out the monorepo/shared-package structure prematurely
// (Guardrails, Section 2/9). Same numbers as the real backend's
// packages/core/src/commission.ts, so nothing has to change when this
// prototype's flows get wired to Supabase.
export const MIN_COMMISSION_RATE = 0.15;
export const DEFAULT_COMMISSION_RATE = 0.18;

// Pricing model for the guest booking funnel (Section 6.3/6.6). A single
// flat per-visit rate keeps the prototype's pricing math legible; the real
// backend would price per-provider.
export const HOURLY_RATE_PAISE = 60000; // ~₹600/hr
export const DEFAULT_VISIT_DURATION_HOURS = 2;
export const VISITS_PER_WEEK = 3;
export const WEEKLY_DISCOUNT_PCT = 15; // "Save 15% vs. booking one-off"

export function oneOffVisitPricePaise(durationHours: number = DEFAULT_VISIT_DURATION_HOURS): number {
  return Math.round(HOURLY_RATE_PAISE * durationHours);
}

export function weeklyPlanPricePaise(
  durationHours: number = DEFAULT_VISIT_DURATION_HOURS,
  visitsPerWeek: number = VISITS_PER_WEEK,
): number {
  const undiscounted = oneOffVisitPricePaise(durationHours) * visitsPerWeek;
  return Math.round(undiscounted * (1 - WEEKLY_DISCOUNT_PCT / 100));
}

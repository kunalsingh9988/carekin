import { describe, expect, it } from "vitest";
import {
  DEFAULT_COMMISSION_RATE,
  DEFAULT_VISIT_DURATION_HOURS,
  HOURLY_RATE_PAISE,
  MIN_COMMISSION_RATE,
  oneOffVisitPricePaise,
  VISITS_PER_WEEK,
  weeklyPlanPricePaise,
  WEEKLY_DISCOUNT_PCT,
} from "./business";

describe("pricing", () => {
  it("prices a one-off visit at the flat hourly rate", () => {
    expect(oneOffVisitPricePaise()).toBe(HOURLY_RATE_PAISE * DEFAULT_VISIT_DURATION_HOURS);
    expect(oneOffVisitPricePaise(4)).toBe(HOURLY_RATE_PAISE * 4);
  });

  it("prices the weekly plan with the 15% discount and honors the chosen frequency", () => {
    const perVisit = oneOffVisitPricePaise();
    // 1x / 2x / 3x visits must each scale — the selector is not decorative.
    expect(weeklyPlanPricePaise(DEFAULT_VISIT_DURATION_HOURS, 1)).toBe(Math.round(perVisit * 0.85));
    expect(weeklyPlanPricePaise(DEFAULT_VISIT_DURATION_HOURS, 2)).toBe(Math.round(perVisit * 2 * 0.85));
    expect(weeklyPlanPricePaise(DEFAULT_VISIT_DURATION_HOURS, VISITS_PER_WEEK)).toBe(
      Math.round(perVisit * VISITS_PER_WEEK * (1 - WEEKLY_DISCOUNT_PCT / 100)),
    );
  });

  it("keeps the commission guardrail constants intact", () => {
    expect(MIN_COMMISSION_RATE).toBe(0.15);
    expect(DEFAULT_COMMISSION_RATE).toBeGreaterThanOrEqual(MIN_COMMISSION_RATE);
  });
});

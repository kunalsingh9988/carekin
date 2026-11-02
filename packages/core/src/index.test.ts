import { describe, expect, it } from "vitest";
import {
  checkBookingEligibility,
  canTransitionVerification,
  computeCommission,
  computeProviderPayout,
  DEFAULT_COMMISSION_RATE,
  isProviderVisible,
  MIN_COMMISSION_RATE,
} from "./index";

describe("isProviderVisible", () => {
  it("only exposes approved providers", () => {
    expect(isProviderVisible("approved")).toBe(true);
    expect(isProviderVisible("pending")).toBe(false);
    expect(isProviderVisible("rejected")).toBe(false);
  });
});

describe("canTransitionVerification", () => {
  it("allows pending → approved and pending → rejected", () => {
    expect(canTransitionVerification("pending", "approved")).toBe(true);
    expect(canTransitionVerification("pending", "rejected")).toBe(true);
  });

  it("treats approved/rejected as terminal — no silent flips", () => {
    expect(canTransitionVerification("approved", "rejected")).toBe(false);
    expect(canTransitionVerification("approved", "pending")).toBe(false);
    expect(canTransitionVerification("rejected", "approved")).toBe(false);
    expect(canTransitionVerification("rejected", "pending")).toBe(false);
    expect(canTransitionVerification("pending", "pending")).toBe(false);
  });
});

describe("computeCommission", () => {
  it("applies the default 18% rate with paise rounding", () => {
    expect(computeCommission(120000)).toBe(21600);
    expect(computeCommission(100001)).toBe(Math.round(100001 * DEFAULT_COMMISSION_RATE));
  });

  it("allows rates at or above the 15% floor", () => {
    expect(computeCommission(100000, MIN_COMMISSION_RATE)).toBe(15000);
    expect(computeCommission(100000, 0.25)).toBe(25000);
  });

  it("throws below the 15% platform minimum", () => {
    expect(() => computeCommission(100000, 0.14)).toThrow(/platform minimum/);
    expect(() => computeCommission(100000, 0)).toThrow();
  });
});

describe("computeProviderPayout", () => {
  it("is amount minus commission", () => {
    const amount = 120000;
    const commission = computeCommission(amount);
    expect(computeProviderPayout(amount, commission)).toBe(amount - commission);
  });
});

describe("checkBookingEligibility", () => {
  const now = new Date("2026-08-01T12:00:00Z");
  const inTwoHours = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  it("accepts a valid booking", () => {
    const result = checkBookingEligibility({
      providerVerificationStatus: "approved",
      scheduledAt: inTwoHours,
      durationHours: 2,
      now,
    });
    expect(result.eligible).toBe(true);
  });

  it("rejects unverified providers before any other check", () => {
    for (const status of ["pending", "rejected"] as const) {
      const result = checkBookingEligibility({
        providerVerificationStatus: status,
        scheduledAt: inTwoHours,
        durationHours: 2,
        now,
      });
      expect(result.eligible).toBe(false);
      expect(result.reason).toMatch(/not verified/);
    }
  });

  it("requires at least 30 minutes lead time", () => {
    const inTwentyMinutes = new Date(now.getTime() + 20 * 60 * 1000);
    expect(
      checkBookingEligibility({ providerVerificationStatus: "approved", scheduledAt: inTwentyMinutes, durationHours: 2, now }).eligible,
    ).toBe(false);
    // Exactly 30 minutes is allowed.
    const inThirtyMinutes = new Date(now.getTime() + 30 * 60 * 1000);
    expect(
      checkBookingEligibility({ providerVerificationStatus: "approved", scheduledAt: inThirtyMinutes, durationHours: 2, now }).eligible,
    ).toBe(true);
  });

  it("rejects past dates and out-of-range durations", () => {
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    expect(checkBookingEligibility({ providerVerificationStatus: "approved", scheduledAt: yesterday, durationHours: 2, now }).eligible).toBe(false);
    expect(checkBookingEligibility({ providerVerificationStatus: "approved", scheduledAt: inTwoHours, durationHours: 0, now }).eligible).toBe(false);
    expect(checkBookingEligibility({ providerVerificationStatus: "approved", scheduledAt: inTwoHours, durationHours: 25, now }).eligible).toBe(false);
    expect(checkBookingEligibility({ providerVerificationStatus: "approved", scheduledAt: inTwoHours, durationHours: 24, now }).eligible).toBe(true);
  });
});

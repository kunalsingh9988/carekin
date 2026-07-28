import { isProviderVisible, VerificationStatus } from "./verification";

export interface BookingEligibilityInput {
  providerVerificationStatus: VerificationStatus;
  scheduledAt: Date;
  durationHours: number;
  now?: Date;
}

export interface BookingEligibilityResult {
  eligible: boolean;
  reason?: string;
}

const MAX_BOOKING_DURATION_HOURS = 24;
const MIN_LEAD_TIME_MINUTES = 30;

// The single source of truth for "is this booking allowed?" (Section 4's
// framing) — a booking request must fail this before it ever reaches a
// Server Action or Edge Function, and RLS on `bookings` should encode the
// same verification-status condition independently as defense in depth.
export function checkBookingEligibility(input: BookingEligibilityInput): BookingEligibilityResult {
  if (!isProviderVisible(input.providerVerificationStatus)) {
    return { eligible: false, reason: "Provider is not verified" };
  }
  if (input.durationHours <= 0 || input.durationHours > MAX_BOOKING_DURATION_HOURS) {
    return { eligible: false, reason: `Duration must be between 0 and ${MAX_BOOKING_DURATION_HOURS} hours` };
  }
  const now = input.now ?? new Date();
  const minutesUntilStart = (input.scheduledAt.getTime() - now.getTime()) / 60_000;
  if (minutesUntilStart < MIN_LEAD_TIME_MINUTES) {
    return { eligible: false, reason: `Bookings need at least ${MIN_LEAD_TIME_MINUTES} minutes' notice` };
  }
  return { eligible: true };
}

import { z } from "zod";
import { BookingType, MIN_COMMISSION_RATE, SubscriptionFrequency } from "./enums";

export const CreateOneOffBookingInput = z.object({
  type: z.literal(BookingType.enum.ONE_OFF),
  providerId: z.string().min(1),
  careRecipientId: z.string().min(1),
  scheduledAt: z.coerce.date(),
  durationHours: z.number().positive().max(24),
});
export type CreateOneOffBookingInput = z.infer<typeof CreateOneOffBookingInput>;

export const CreateSubscriptionInput = z.object({
  type: z.literal(BookingType.enum.SUBSCRIPTION),
  providerId: z.string().min(1),
  careRecipientId: z.string().min(1),
  frequency: SubscriptionFrequency,
  startDate: z.coerce.date(),
  durationHoursPerVisit: z.number().positive().max(24),
});
export type CreateSubscriptionInput = z.infer<typeof CreateSubscriptionInput>;

export const CreateBookingInput = z.discriminatedUnion("type", [
  CreateOneOffBookingInput,
  CreateSubscriptionInput,
]);
export type CreateBookingInput = z.infer<typeof CreateBookingInput>;

// Never let commission drop below the platform floor — Section 11 guardrail.
export function computeCommission(amount: number, rate: number = MIN_COMMISSION_RATE): number {
  if (rate < MIN_COMMISSION_RATE) {
    throw new Error(`Commission rate ${rate} is below the platform minimum of ${MIN_COMMISSION_RATE}`);
  }
  return Math.round(amount * rate * 100) / 100;
}

export const CreateReviewInput = z.object({
  bookingId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});
export type CreateReviewInput = z.infer<typeof CreateReviewInput>;

import { z } from "zod";
import { BookingType, SubscriptionFrequency } from "./enums";

export const CreateOneOffBookingInput = z.object({
  type: z.literal(BookingType.enum.one_off),
  providerId: z.string().uuid(),
  careRecipientId: z.string().uuid(),
  scheduledAt: z.coerce.date(),
  durationHours: z.number().positive().max(24),
});
export type CreateOneOffBookingInput = z.infer<typeof CreateOneOffBookingInput>;

export const CreateSubscriptionInput = z.object({
  type: z.literal(BookingType.enum.subscription),
  providerId: z.string().uuid(),
  careRecipientId: z.string().uuid(),
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

export const CreateReviewInput = z.object({
  bookingId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});
export type CreateReviewInput = z.infer<typeof CreateReviewInput>;

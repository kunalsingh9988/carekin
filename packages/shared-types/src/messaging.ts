import { z } from "zod";

// Server must reject writes unless the booking is CONFIRMED or COMPLETED —
// this schema only validates shape, not the unlock rule (Section 7).
export const SendMessageInput = z.object({
  bookingId: z.string().min(1),
  content: z.string().min(1).max(4000),
});
export type SendMessageInput = z.infer<typeof SendMessageInput>;

import { z } from "zod";

// Server must reject writes unless the booking is confirmed/completed —
// this schema only validates shape; the unlock rule is enforced by RLS on
// the messages table (Section 2 guardrail), not by this schema.
export const SendMessageInput = z.object({
  bookingId: z.string().uuid(),
  content: z.string().min(1).max(4000),
});
export type SendMessageInput = z.infer<typeof SendMessageInput>;

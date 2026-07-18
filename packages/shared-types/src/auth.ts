import { z } from "zod";
import { UserRole } from "./enums";

// E.164-ish phone validation; strict enough to catch obvious typos without
// over-constraining formats across regions.
export const PhoneNumber = z.string().regex(/^\+[1-9]\d{7,14}$/, "Must be E.164 format, e.g. +919876543210");

export const RequestOtpInput = z.object({
  phone: PhoneNumber,
  role: UserRole,
});
export type RequestOtpInput = z.infer<typeof RequestOtpInput>;

export const VerifyOtpInput = z.object({
  phone: PhoneNumber,
  otp: z.string().length(6),
  // Only used on first login to create the User row; ignored on subsequent
  // verifications since role is fixed once a User exists.
  role: UserRole,
});
export type VerifyOtpInput = z.infer<typeof VerifyOtpInput>;

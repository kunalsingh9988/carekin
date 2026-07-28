import { z } from "zod";
import { UserRole } from "./enums";

// E.164 — Supabase phone auth requires this format.
export const PhoneNumber = z.string().regex(/^\+[1-9]\d{7,14}$/, "Must be E.164 format, e.g. +919876543210");

export const RequestOtpInput = z.object({
  phone: PhoneNumber,
});
export type RequestOtpInput = z.infer<typeof RequestOtpInput>;

export const VerifyOtpInput = z.object({
  phone: PhoneNumber,
  token: z.string().length(6),
  // Only meaningful on first login — see the role-assignment note in
  // apps/web/app/(auth)/verify-otp. Role changes after signup are an admin
  // action, not something a client can set.
  role: UserRole,
});
export type VerifyOtpInput = z.infer<typeof VerifyOtpInput>;

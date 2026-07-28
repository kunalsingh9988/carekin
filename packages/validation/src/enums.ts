import { z } from "zod";

// Mirrors the Postgres enum types in packages/supabase/migrations — kept in
// hand-written lockstep since these are Zod schemas, not generated. Lowercase
// values match Postgres/RLS convention (see the spec's own policy example:
// `role = 'admin'`, `verification_status = 'approved'`).

export const UserRole = z.enum(["family", "provider", "admin"]);
export type UserRole = z.infer<typeof UserRole>;

export const CareRecipientType = z.enum(["elder", "child"]);
export type CareRecipientType = z.infer<typeof CareRecipientType>;

export const ProviderType = z.enum(["caregiver", "babysitter"]);
export type ProviderType = z.infer<typeof ProviderType>;

export const VerificationStatus = z.enum(["pending", "approved", "rejected"]);
export type VerificationStatus = z.infer<typeof VerificationStatus>;

export const DocumentType = z.enum(["id_proof", "address_proof", "certificate"]);
export type DocumentType = z.infer<typeof DocumentType>;

export const BookingType = z.enum(["one_off", "subscription"]);
export type BookingType = z.infer<typeof BookingType>;

export const BookingStatus = z.enum([
  "requested",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
  "disputed",
]);
export type BookingStatus = z.infer<typeof BookingStatus>;

export const SubscriptionFrequency = z.enum(["weekly", "monthly"]);
export type SubscriptionFrequency = z.infer<typeof SubscriptionFrequency>;

export const SubscriptionStatus = z.enum(["active", "paused", "cancelled"]);
export type SubscriptionStatus = z.infer<typeof SubscriptionStatus>;

export const PaymentStatus = z.enum(["created", "captured", "failed", "refunded"]);
export type PaymentStatus = z.infer<typeof PaymentStatus>;

export const PayoutStatus = z.enum(["queued", "processing", "paid", "failed"]);
export type PayoutStatus = z.infer<typeof PayoutStatus>;

export const ParentalConsentMethod = z.enum(["in_app_checkbox", "digital_signature", "otp_confirmation"]);
export type ParentalConsentMethod = z.infer<typeof ParentalConsentMethod>;

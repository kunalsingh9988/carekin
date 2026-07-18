import { z } from "zod";

// Mirrors infra/prisma/schema.prisma enums. Keep these in lockstep with the
// Prisma schema by hand — Phase 1 doesn't generate this file.

export const UserRole = z.enum(["FAMILY", "PROVIDER", "ADMIN"]);
export type UserRole = z.infer<typeof UserRole>;

export const CareRecipientType = z.enum(["ELDER", "CHILD"]);
export type CareRecipientType = z.infer<typeof CareRecipientType>;

export const ProviderType = z.enum(["CAREGIVER", "BABYSITTER"]);
export type ProviderType = z.infer<typeof ProviderType>;

export const VerificationStatus = z.enum(["PENDING", "APPROVED", "REJECTED"]);
export type VerificationStatus = z.infer<typeof VerificationStatus>;

export const DocumentType = z.enum(["ID_PROOF", "ADDRESS_PROOF", "CERTIFICATE"]);
export type DocumentType = z.infer<typeof DocumentType>;

export const BookingType = z.enum(["ONE_OFF", "SUBSCRIPTION"]);
export type BookingType = z.infer<typeof BookingType>;

export const BookingStatus = z.enum([
  "REQUESTED",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "DISPUTED",
]);
export type BookingStatus = z.infer<typeof BookingStatus>;

export const SubscriptionFrequency = z.enum(["WEEKLY", "MONTHLY"]);
export type SubscriptionFrequency = z.infer<typeof SubscriptionFrequency>;

export const SubscriptionStatus = z.enum(["ACTIVE", "PAUSED", "CANCELLED"]);
export type SubscriptionStatus = z.infer<typeof SubscriptionStatus>;

export const PaymentStatus = z.enum(["CREATED", "CAPTURED", "FAILED", "REFUNDED"]);
export type PaymentStatus = z.infer<typeof PaymentStatus>;

export const PayoutStatus = z.enum(["QUEUED", "PROCESSING", "PAID", "FAILED"]);
export type PayoutStatus = z.infer<typeof PayoutStatus>;

export const NotificationType = z.enum([
  "BOOKING_CONFIRMED",
  "PROVIDER_ASSIGNED",
  "VISIT_REMINDER",
  "PAYMENT_RECEIPT",
  "VERIFICATION_UPDATE",
  "PAYOUT_UPDATE",
]);
export type NotificationType = z.infer<typeof NotificationType>;

// Minimum platform commission — see Section 11 guardrail: never below 15%
// anywhere in pricing logic. Import this constant rather than hardcoding.
export const MIN_COMMISSION_RATE = 0.15;

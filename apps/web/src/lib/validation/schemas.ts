// Written to be lifted into packages/validation unchanged once the real
// backend is built (Guardrails, Section 3) — kept close to the real
// schema's shape (packages/validation in the Supabase-backed build), just
// without any Supabase-specific bits.
import { z } from "zod";

export const PhoneNumber = z.string().regex(/^\+[1-9]\d{7,14}$/, "Enter a valid phone number, e.g. +919876543210");
export function providerPhoneDefault(value?: string): string {
  const result=PhoneNumber.safeParse(value?.trim());
  return result.success ? result.data : "+91";
}

export const UserRole = z.enum(["family", "provider", "admin"]);
export type UserRoleValue = z.infer<typeof UserRole>;

export const FamilyProfileSchema = z.object({
  name: z.string().min(1, "Required"),
  address: z.string().min(1, "Required"),
  latitude: z.number(),
  longitude: z.number(),
});
export type FamilyProfileFormValues = z.infer<typeof FamilyProfileSchema>;

export const ElderRecipientSchema = z.object({
  type: z.literal("elder"),
  name: z.string().min(1, "Required"),
  notes: z.string().optional(),
});

export const ChildRecipientSchema = z.object({
  type: z.literal("child"),
  name: z.string().min(1, "Required"),
  notes: z.string().optional(),
  consentedByName: z.string().min(1, "Required"),
  consentMethod: z.enum(["in_app_checkbox", "digital_signature", "otp_confirmation"]),
});

export const CareRecipientSchema = z.discriminatedUnion("type", [ElderRecipientSchema, ChildRecipientSchema]);
export type CareRecipientFormValues = z.infer<typeof CareRecipientSchema>;

export const ProviderProfileSchema = z.object({
  type: z.enum(["caregiver", "babysitter"]),
  name: z.string().min(1, "Required"),
  phone: PhoneNumber,
  bio: z.string().optional(),
  serviceRadiusKm: z.coerce.number().positive().max(50),
  latitude: z.number(),
  longitude: z.number(),
});
export type ProviderProfileFormValues = z.infer<typeof ProviderProfileSchema>;

export const BookingSchema = z.object({
  careRecipientId: z.string().min(1, "Select who this is for"),
  scheduledDate: z.string().min(1, "Required"),
  scheduledTime: z.string().min(1, "Required"),
  durationHours: z.coerce.number().positive().max(24),
});
export type BookingFormValues = z.infer<typeof BookingSchema>;

export const ReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});
export type ReviewFormValues = z.infer<typeof ReviewSchema>;

export const MessageSchema = z.object({
  content: z.string().min(1, "Message can't be empty"),
});
export type MessageFormValues = z.infer<typeof MessageSchema>;

export const RejectProviderSchema = z.object({
  reason: z.string().min(1, "Give a reason so the provider knows what to fix"),
});
export type RejectProviderFormValues = z.infer<typeof RejectProviderSchema>;

import { z } from "zod";
import { CareRecipientType, ParentalConsentMethod, ProviderType } from "./enums";
import { GeoPoint } from "./geo";

export const FamilyProfileInput = z
  .object({
    name: z.string().min(1).max(120),
    address: z.string().min(1).max(300),
  })
  .merge(GeoPoint);
export type FamilyProfileInput = z.infer<typeof FamilyProfileInput>;

// Elder recipients need no extra step. Child recipients require verifiable
// parental consent as a distinct, logged action (DPDP Act Section 9) — the
// discriminated union makes it impossible to submit a child recipient
// without the consent fields at the type level, not just by convention.
export const ElderRecipientInput = z.object({
  type: z.literal(CareRecipientType.enum.elder),
  name: z.string().min(1).max(120),
  notes: z.string().max(1000).optional(),
});
export type ElderRecipientInput = z.infer<typeof ElderRecipientInput>;

export const ChildRecipientInput = z.object({
  type: z.literal(CareRecipientType.enum.child),
  name: z.string().min(1).max(120),
  notes: z.string().max(1000).optional(),
  parentalConsent: z.object({
    method: ParentalConsentMethod,
    consentedByName: z.string().min(1).max(120),
  }),
});
export type ChildRecipientInput = z.infer<typeof ChildRecipientInput>;

export const CareRecipientInput = z.discriminatedUnion("type", [ElderRecipientInput, ChildRecipientInput]);
export type CareRecipientInput = z.infer<typeof CareRecipientInput>;

export const ProviderProfileInput = z
  .object({
    type: ProviderType,
    bio: z.string().max(2000).optional(),
    serviceRadiusKm: z.number().positive().max(50).default(5),
  })
  .merge(GeoPoint);
export type ProviderProfileInput = z.infer<typeof ProviderProfileInput>;

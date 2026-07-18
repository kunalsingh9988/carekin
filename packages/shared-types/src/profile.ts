import { z } from "zod";
import { CareRecipientType, ProviderType } from "./enums";
import { GeoPoint } from "./geo";

export const FamilyProfileInput = z.object({
  name: z.string().min(1).max(120),
  address: z.string().min(1).max(300),
}).merge(GeoPoint);
export type FamilyProfileInput = z.infer<typeof FamilyProfileInput>;

export const CareRecipientInput = z.object({
  type: CareRecipientType,
  name: z.string().min(1).max(120),
  // Free-text only — see Section 11: no structured medical/health data in Phase 1.
  notes: z.string().max(1000).optional(),
});
export type CareRecipientInput = z.infer<typeof CareRecipientInput>;

export const ProviderProfileInput = z.object({
  type: ProviderType,
  bio: z.string().max(2000).optional(),
  serviceRadiusKm: z.number().positive().max(50).default(5),
}).merge(GeoPoint);
export type ProviderProfileInput = z.infer<typeof ProviderProfileInput>;

import { z } from "zod";
import { DocumentType } from "./enums";

export const DocumentUploadInput = z.object({
  type: DocumentType,
  storageKey: z.string().min(1),
});
export type DocumentUploadInput = z.infer<typeof DocumentUploadInput>;

// Admin-only — enforced server-side (the review_verification Postgres
// function checks is_admin() internally), not just by this schema. A human
// admin must always countersign here, even after automated KYC checks pass.
export const ReviewVerificationInput = z.object({
  providerId: z.string().uuid(),
  status: z.enum(["approved", "rejected"]),
  notes: z.string().max(2000).optional(),
});
export type ReviewVerificationInput = z.infer<typeof ReviewVerificationInput>;

// Payload shape for the future KYC-vendor webhook -> Edge Function. Not
// wired up yet — no vendor account exists (Section 12 of the original build
// prompt / Section 8 of this spec).
export const VerificationWebhookPayload = z.object({
  kycProviderRef: z.string(),
  status: z.enum(["passed", "failed", "in_progress"]),
  policeVerificationRef: z.string().optional(),
  raw: z.record(z.string(), z.unknown()).optional(),
});
export type VerificationWebhookPayload = z.infer<typeof VerificationWebhookPayload>;

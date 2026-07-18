import { z } from "zod";
import { DocumentType } from "./enums";

export const DocumentUploadInput = z.object({
  type: DocumentType,
  s3Key: z.string().min(1),
});
export type DocumentUploadInput = z.infer<typeof DocumentUploadInput>;

// Admin-only action — enforced server-side by role, not just this schema.
// A human admin must always countersign here, even if the KYC vendor's
// automated check already came back positive (Section 7 / Section 11).
export const ReviewVerificationInput = z.object({
  verificationRecordId: z.string().min(1),
  status: z.enum(["APPROVED", "REJECTED"]),
  notes: z.string().max(2000).optional(),
});
export type ReviewVerificationInput = z.infer<typeof ReviewVerificationInput>;

export const VerificationWebhookPayload = z.object({
  kycProviderRef: z.string(),
  status: z.enum(["PASSED", "FAILED", "IN_PROGRESS"]),
  policeVerificationRef: z.string().optional(),
  raw: z.record(z.string(), z.unknown()).optional(),
});
export type VerificationWebhookPayload = z.infer<typeof VerificationWebhookPayload>;

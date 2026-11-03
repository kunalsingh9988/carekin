// Mirrors the real Postgres schema (packages/supabase/migrations) table-for-
// table, field-for-field — snake_case, same names — so swapping this
// localStorage layer for real Supabase calls later is a data-layer change,
// not a redesign (Guardrails, Section 2/5). Money is integer paise, same
// convention as the real schema (Razorpay's own unit).

export type UserRole = "family" | "provider" | "admin";

export interface CurrentUser {
  id: string;
  role: UserRole;
  phone: string;
  created_at: string;
}

export interface FamilyProfile {
  id: string;
  user_id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  created_at: string;
  updated_at: string;
}

export type CareRecipientType = "elder" | "child";
export type ParentalConsentMethod = "in_app_checkbox" | "digital_signature" | "otp_confirmation";

export interface ParentalConsent {
  id: string;
  care_recipient_id: string;
  consented_by: string;
  method: ParentalConsentMethod;
  consented_by_name: string;
  consented_at: string;
  withdrawn_at: string | null;
}

export interface CareRecipient {
  id: string;
  family_id: string;
  type: CareRecipientType;
  name: string;
  notes: string | null;
  parental_consent_id: string | null;
  created_at: string;
  updated_at: string;
}

export type ProviderType = "caregiver" | "babysitter";
export type VerificationStatus = "pending" | "approved" | "rejected";

export interface Provider {
  id: string;
  user_id: string;
  type: ProviderType;
  name: string;
  phone: string;
  bio: string | null;
  service_radius_km: number;
  latitude: number;
  longitude: number;
  verification_status: VerificationStatus;
  photo_seed: string;
  created_at: string;
  updated_at: string;
}

export interface VerificationReview {
  id: string;
  provider_id: string;
  from_status: VerificationStatus | null;
  to_status: VerificationStatus;
  reviewed_by: string | null;
  reason: string | null;
  created_at: string;
}

export type DocumentType = "id_proof" | "address_proof" | "certificate";
export type DocumentStatus = "pending" | "verified";

export interface ProviderDocument {
  id: string;
  provider_id: string;
  type: DocumentType;
  filename: string;
  storage_key?: string;
  status: DocumentStatus;
  uploaded_at: string;
}

export type BookingType = "one_off" | "subscription";
export type BookingStatus = "requested" | "confirmed" | "in_progress" | "completed" | "cancelled" | "disputed";

export interface Booking {
  id: string;
  family_id: string;
  provider_id: string;
  care_recipient_id: string;
  type: BookingType;
  status: BookingStatus;
  scheduled_at: string;
  duration_hours: number;
  amount_paise: number;
  commission_paise: number;
  subscription_id: string | null;
  created_at: string;
  updated_at: string;
}

export type SubscriptionFrequency = "weekly" | "monthly";
export type SubscriptionStatus = "active" | "paused" | "cancelled";

export interface Subscription {
  id: string;
  family_id: string;
  provider_id: string;
  frequency: SubscriptionFrequency;
  amount_paise: number;
  next_billing_date: string;
  status: SubscriptionStatus;
  created_at: string;
  updated_at: string;
}

export type PaymentStatus = "created" | "captured" | "failed" | "refunded";

export interface Payment {
  id: string;
  booking_id: string;
  status: PaymentStatus;
  amount_paise: number;
  captured_at: string | null;
  created_at: string;
  updated_at: string;
}

// Simplified vs. the real schema's queued/processing/paid/failed, matching
// this prototype's own spec (Section 8's mock-behaviors table).
export type PayoutStatus = "pending" | "paid";

export interface Payout {
  id: string;
  provider_id: string;
  booking_id: string;
  amount_paise: number;
  status: PayoutStatus;
  created_at: string;
  paid_at: string | null;
}

export interface Review {
  id: string;
  booking_id: string;
  provider_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  booking_id: string;
  sender_id: string;
  sender_role: UserRole;
  content: string;
  created_at: string;
}

export type DisputeStatus = "open" | "resolved";

export interface Dispute {
  id: string;
  booking_id: string;
  raised_by: string;
  reason: string;
  status: DisputeStatus;
  resolution_notes: string | null;
  created_at: string;
  resolved_at: string | null;
}

// Session-scoped only — a guest's booking selection before they have an
// account (Guardrails: "guest state must survive the signup gate"). Lives
// in lib/storage/session.ts, not the repositories above, and is never
// itself a real domain record.
export interface PendingBooking {
  providerId: string;
  type: BookingType;
  frequency?: SubscriptionFrequency;
  visitsPerWeek?: number;
  scheduledDate: string;
  scheduledTime: string;
  durationHours: number;
  amountPaise: number;
  careRecipientId?: string;
  createdAt: string;
}

export interface Referral {
  id: string;
  referrer_family_id: string;
  referred_family_id: string;
  created_at: string;
}

// Represents SMS/push in this prototype — an in-app entry only (Section 8).
export type NotificationType =
  | "booking_confirmed"
  | "booking_cancelled"
  | "payment_receipt"
  | "verification_update"
  | "payout_update"
  | "new_message";

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  message: string;
  read: boolean;
  created_at: string;
}

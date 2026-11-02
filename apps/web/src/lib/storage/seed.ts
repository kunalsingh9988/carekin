// Populates localStorage with realistic demo data on first load (Build
// Order step 2). This data represents OTHER people already using the
// platform — providers to search for, bookings to see in the admin
// console — not anything belonging to whoever is testing the prototype.
// The tester's own journey (sign up, onboard, book) starts empty on
// purpose, so every list view's empty state actually gets exercised.
import { get, set } from "./client";
import type {
  Booking,
  CareRecipient,
  Dispute,
  FamilyProfile,
  Payout,
  Provider,
  ProviderDocument,
  Review,
  VerificationReview,
} from "./types";

const SEED_FLAG_KEY = "seededV2";

// Koramangala, Bengaluru — same pilot-neighborhood cluster used throughout
// the earlier build prompts, kept for continuity.
const CENTER = { lat: 12.9352, lng: 77.6146 };
function jitter(base: number, spreadKm: number): number {
  const spreadDeg = spreadKm / 111; // ~111km per degree of latitude
  return base + (Math.random() * 2 - 1) * spreadDeg;
}

const FAMILY_NAMES = ["Priya Sharma", "Arjun Mehta", "Lakshmi Iyer", "Rohan Kapoor"];
const FAMILY_ADDRESSES = [
  "4th Block, Koramangala, Bengaluru",
  "5th Block, Koramangala, Bengaluru",
  "6th Block, Koramangala, Bengaluru",
  "1st Block, Koramangala, Bengaluru",
];

const CAREGIVER_NAMES = [
  "Sunita Rao", "Manjunath Gowda", "Kavitha Reddy", "Ramesh Naidu", "Anitha Nair",
  "Suresh Kumar", "Vidya Shenoy", "Prakash Achar", "Geetha Bhat", "Nagesh Rao",
];
const BABYSITTER_NAMES = [
  "Divya Menon", "Pooja Iyengar", "Sneha Kulkarni", "Ananya Rao", "Kiran Desai", "Meera Pillai",
];

const CARE_RECIPIENT_NOTES_ELDER = [
  "Needs help with mobility, morning walks preferred",
  "Diabetic, medicine reminder at 8am and 8pm",
  "Recovering from hip surgery, needs assistance standing",
];
const CARE_RECIPIENT_NOTES_CHILD = ["Age 6, allergic to peanuts", "Age 4, naps 1-3pm"];

function iso(daysFromNow: number, hour = 10): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

export function isSeeded(): boolean {
  return get<boolean>(SEED_FLAG_KEY, false);
}

export function seedIfNeeded(): void {
  if (isSeeded()) return;

  const now = new Date().toISOString();

  // --- Families + care recipients ---
  const families: FamilyProfile[] = FAMILY_NAMES.map((name, i) => ({
    id: `seed-family-${i + 1}`,
    user_id: `seed-family-user-${i + 1}`,
    name,
    address: FAMILY_ADDRESSES[i],
    latitude: jitter(CENTER.lat, 2),
    longitude: jitter(CENTER.lng, 2),
    created_at: now,
    updated_at: now,
  }));
  set("families", families);

  const careRecipients: CareRecipient[] = [
    {
      id: "seed-recipient-1",
      family_id: "seed-family-1",
      type: "elder",
      name: "Priya's mother, Kamala",
      notes: CARE_RECIPIENT_NOTES_ELDER[0],
      parental_consent_id: null,
      created_at: now,
      updated_at: now,
    },
    {
      id: "seed-recipient-2",
      family_id: "seed-family-2",
      type: "elder",
      name: "Arjun's father, Ramesh",
      notes: CARE_RECIPIENT_NOTES_ELDER[1],
      parental_consent_id: null,
      created_at: now,
      updated_at: now,
    },
    {
      id: "seed-recipient-3",
      family_id: "seed-family-3",
      type: "child",
      name: "Lakshmi's son, Karthik",
      notes: CARE_RECIPIENT_NOTES_CHILD[0],
      parental_consent_id: "seed-consent-1",
      created_at: now,
      updated_at: now,
    },
    {
      id: "seed-recipient-4",
      family_id: "seed-family-4",
      type: "elder",
      name: "Rohan's mother, Sarala",
      notes: CARE_RECIPIENT_NOTES_ELDER[2],
      parental_consent_id: null,
      created_at: now,
      updated_at: now,
    },
  ];
  set("careRecipients", careRecipients);
  set("parentalConsents", [
    {
      id: "seed-consent-1",
      care_recipient_id: "seed-recipient-3",
      consented_by: "seed-family-user-3",
      method: "in_app_checkbox",
      consented_by_name: "Lakshmi Iyer",
      consented_at: now,
      withdrawn_at: null,
    },
  ]);

  // --- Providers: mixed types + verification states ---
  const providers: Provider[] = [];
  const verificationReviews: VerificationReview[] = [];
  const documents: ProviderDocument[] = [];

  function pushProvider(
    idx: number,
    name: string,
    type: "caregiver" | "babysitter",
    status: "pending" | "approved" | "rejected",
  ) {
    const id = `seed-provider-${idx}`;
    const phone = `+9198200${String(10000 + idx).slice(-5)}`;
    providers.push({
      id,
      user_id: `seed-provider-user-${idx}`,
      type,
      name,
      phone,
      bio:
        type === "caregiver"
          ? "Experienced with elder mobility assistance and daily living support."
          : "Early-childhood focused, comfortable with infants and toddlers.",
      service_radius_km: 5 + (idx % 3),
      latitude: jitter(CENTER.lat, 3),
      longitude: jitter(CENTER.lng, 3),
      verification_status: status,
      photo_seed: name,
      created_at: now,
      updated_at: now,
    });

    verificationReviews.push({
      id: `seed-review-${idx}-1`,
      provider_id: id,
      from_status: null,
      to_status: "pending",
      reviewed_by: null,
      reason: "Application submitted",
      created_at: now,
    });

    if (status !== "pending") {
      verificationReviews.push({
        id: `seed-review-${idx}-2`,
        provider_id: id,
        from_status: "pending",
        to_status: status,
        reviewed_by: "seed-admin-user",
        reason: status === "approved" ? "KYC and police verification clear." : "Police verification flagged an unresolved case.",
        created_at: now,
      });
    }

    documents.push(
      { id: `seed-doc-${idx}-1`, provider_id: id, type: "id_proof", filename: "aadhaar-card.pdf", status: status === "approved" ? "verified" : "pending", uploaded_at: now },
      { id: `seed-doc-${idx}-2`, provider_id: id, type: "address_proof", filename: "address-proof.pdf", status: status === "approved" ? "verified" : "pending", uploaded_at: now },
    );
  }

  let idx = 1;
  // 8 approved caregivers, 2 approved babysitters = 10 approved
  CAREGIVER_NAMES.slice(0, 8).forEach((n) => pushProvider(idx++, n, "caregiver", "approved"));
  BABYSITTER_NAMES.slice(0, 2).forEach((n) => pushProvider(idx++, n, "babysitter", "approved"));
  // 2 pending caregivers, 2 pending babysitters = 4 pending
  CAREGIVER_NAMES.slice(8, 10).forEach((n) => pushProvider(idx++, n, "caregiver", "pending"));
  BABYSITTER_NAMES.slice(2, 4).forEach((n) => pushProvider(idx++, n, "babysitter", "pending"));
  // 1 rejected caregiver, 1 rejected babysitter = 2 rejected
  pushProvider(idx++, "Vinod Shetty", "caregiver", "rejected");
  BABYSITTER_NAMES.slice(4, 5).forEach((n) => pushProvider(idx++, n, "babysitter", "rejected"));

  set("providers", providers);
  set("verificationReviews", verificationReviews);
  set("providerDocuments", documents);

  // --- Bookings across statuses, using the first two approved providers ---
  const approvedIds = providers.filter((p) => p.verification_status === "approved").map((p) => p.id);
  const bookings: Booking[] = [
    {
      id: "seed-booking-completed-1",
      family_id: "seed-family-1",
      provider_id: approvedIds[0],
      care_recipient_id: "seed-recipient-1",
      type: "one_off",
      status: "completed",
      scheduled_at: iso(-5),
      duration_hours: 4,
      amount_paise: 200000,
      commission_paise: 36000,
      subscription_id: null,
      created_at: iso(-6),
      updated_at: iso(-5),
    },
    {
      id: "seed-booking-completed-2",
      family_id: "seed-family-2",
      provider_id: approvedIds[1],
      care_recipient_id: "seed-recipient-2",
      type: "one_off",
      status: "completed",
      scheduled_at: iso(-3),
      duration_hours: 3,
      amount_paise: 150000,
      commission_paise: 27000,
      subscription_id: null,
      created_at: iso(-4),
      updated_at: iso(-3),
    },
    {
      id: "seed-booking-confirmed-1",
      family_id: "seed-family-3",
      provider_id: approvedIds[2] ?? approvedIds[0],
      care_recipient_id: "seed-recipient-3",
      type: "one_off",
      status: "confirmed",
      scheduled_at: iso(2),
      duration_hours: 3,
      amount_paise: 180000,
      commission_paise: 32400,
      subscription_id: null,
      created_at: iso(-1),
      updated_at: iso(-1),
    },
    {
      id: "seed-booking-requested-1",
      family_id: "seed-family-4",
      provider_id: approvedIds[3] ?? approvedIds[0],
      care_recipient_id: "seed-recipient-4",
      type: "one_off",
      status: "requested",
      scheduled_at: iso(4),
      duration_hours: 5,
      amount_paise: 250000,
      commission_paise: 45000,
      subscription_id: null,
      created_at: iso(0),
      updated_at: iso(0),
    },
    {
      id: "seed-booking-cancelled-1",
      family_id: "seed-family-1",
      provider_id: approvedIds[4] ?? approvedIds[0],
      care_recipient_id: "seed-recipient-1",
      type: "one_off",
      status: "cancelled",
      scheduled_at: iso(-2),
      duration_hours: 2,
      amount_paise: 100000,
      commission_paise: 18000,
      subscription_id: null,
      created_at: iso(-3),
      updated_at: iso(-2),
    },
    {
      id: "seed-booking-disputed-1",
      family_id: "seed-family-2",
      provider_id: approvedIds[5] ?? approvedIds[0],
      care_recipient_id: "seed-recipient-2",
      type: "one_off",
      status: "disputed",
      scheduled_at: iso(-1),
      duration_hours: 4,
      amount_paise: 200000,
      commission_paise: 36000,
      subscription_id: null,
      created_at: iso(-2),
      updated_at: iso(-1),
    },
  ];
  set("bookings", bookings);

  // --- Reviews for completed bookings ---
  const reviews: Review[] = [
    {
      id: "seed-review-booking-1",
      booking_id: "seed-booking-completed-1",
      provider_id: approvedIds[0],
      rating: 5,
      comment: "Very patient with my mother, showed up on time.",
      created_at: iso(-5),
    },
    {
      id: "seed-review-booking-2",
      booking_id: "seed-booking-completed-2",
      provider_id: approvedIds[1],
      rating: 4,
      comment: "Good with my father, would book again.",
      created_at: iso(-3),
    },
  ];
  set("reviews", reviews);

  // --- Payouts: one paid, one pending, matching the two completed bookings ---
  const payouts: Payout[] = [
    {
      id: "seed-payout-1",
      provider_id: approvedIds[0],
      booking_id: "seed-booking-completed-1",
      amount_paise: 164000,
      status: "paid",
      created_at: iso(-5),
      paid_at: iso(-4),
    },
    {
      id: "seed-payout-2",
      provider_id: approvedIds[1],
      booking_id: "seed-booking-completed-2",
      amount_paise: 123000,
      status: "pending",
      created_at: iso(-3),
      paid_at: null,
    },
  ];
  set("payouts", payouts);

  // --- Payment for the requested booking — a `requested` booking is one
  // the family has PAID but the provider hasn't accepted yet, so it needs
  // a captured payment behind it (unpaid requests are checkout leftovers).
  set("payments", [
    {
      id: "seed-payment-requested-1",
      booking_id: "seed-booking-requested-1",
      status: "captured",
      amount_paise: 250000,
      captured_at: iso(0, 9),
      created_at: iso(0, 9),
      updated_at: iso(0, 9),
    },
  ]);

  // --- Dispute for the disputed booking ---
  const disputes: Dispute[] = [
    {
      id: "seed-dispute-1",
      booking_id: "seed-booking-disputed-1",
      raised_by: "seed-family-user-2",
      reason: "Provider left 40 minutes early without notice.",
      status: "open",
      resolution_notes: null,
      created_at: iso(-1),
      resolved_at: null,
    },
  ];
  set("disputes", disputes);

  // --- Messages for the confirmed booking ---
  set("messages", [
    {
      id: "seed-message-1",
      booking_id: "seed-booking-confirmed-1",
      sender_id: "seed-family-user-3",
      sender_role: "family",
      content: "Hi, looking forward to Thursday — please come to the gate, not the lobby.",
      created_at: iso(-1),
    },
    {
      id: "seed-message-2",
      booking_id: "seed-booking-confirmed-1",
      sender_id: approvedIds[2] ? "seed-provider-user-3" : "seed-provider-user-1",
      sender_role: "provider",
      content: "Sounds good, see you then!",
      created_at: iso(-1, 11),
    },
  ]);

  set(SEED_FLAG_KEY, true);
}

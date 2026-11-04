"use client";

import { use, useEffect, useState } from "react";
import { useRouter, notFound } from "next/navigation";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { LocationPicker } from "@/components/onboarding/LocationPicker";
import type { LocationCoordinates } from "@/lib/locations";
import { getFamilyProfile, saveFamilyProfile, getCareRecipients, addElderRecipient } from "@/lib/storage/repositories/families";
import { getProviderPublic, type GuestSafeProvider } from "@/lib/storage/repositories/providers";
import { setPendingBooking, getPendingBooking, getPendingReferral, clearPendingReferral, setPendingChildRecipient } from "@/lib/storage/session";
import { findFamilyIdByReferralCode, recordReferral } from "@/lib/storage/repositories/referrals";
import { get } from "@/lib/storage/client";
import type { CareRecipient, CareRecipientType, FamilyProfile, PendingBooking } from "@/lib/storage/types";
import { OnboardingFrame } from "@/components/onboarding/OnboardingFrame";
import { BookingSummaryCard } from "@/components/booking/BookingSummaryCard";
import { Button } from "@/components/ui/Button";
import { TextField, TextAreaField } from "@/components/ui/FormField";

export default function BookingProfilePage({ params }: { params: Promise<{ providerId: string }> }) {
  const { providerId } = use(params);
  const router = useRouter();
  const user = useRequireRole("family");

  const [provider, setProvider] = useState<GuestSafeProvider | null | undefined>(undefined);
  const [pending, setPending] = useState<PendingBooking | null>(null);
  const [family, setFamily] = useState<FamilyProfile | null>(null);
  const [recipients, setRecipients] = useState<CareRecipient[]>([]);
  const [coords, setCoords] = useState<LocationCoordinates | null>(null);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [recipientType, setRecipientType] = useState<CareRecipientType>("elder");
  const [recipientName, setRecipientName] = useState("");
  const [recipientNotes, setRecipientNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    getProviderPublic(providerId).then(setProvider);
    queueMicrotask(() => {
      const existing = getPendingBooking();
      if (!existing || existing.providerId !== providerId) {
        router.replace(`/book/${providerId}`);
        return;
      }
      setPending(existing);
    });
    getFamilyProfile(user.id).then((f) => {
      setFamily(f);
      if (f) {
        setName(f.name);
        setAddress(f.address);
        getCareRecipients(f.id).then(setRecipients);
      }
    });
  }, [providerId, user, router]);

  if (provider === null) notFound();
  if (!user || provider === undefined) return null;

  // Returning-family shortcut (Section 6.8) — an existing care recipient
  // means skip straight past the form entirely.
  async function handleUseExisting(recipient: CareRecipient) {
    setPendingBooking({ careRecipientId: recipient.id });
    router.push(`/book/${providerId}/pay`);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!coords && !family) return;
    setSubmitting(true);

    const isNewFamily = !family;
    const savedFamily = await saveFamilyProfile(user.id, {
      name,
      address,
      latitude: coords?.latitude ?? family!.latitude,
      longitude: coords?.longitude ?? family!.longitude,
    });

    // Referral capture (Section: give-₹X-get-₹X) — recorded the moment a
    // NEW family profile first exists; never for returning families, never
    // for self-referrals (recordReferral dedupes and rejects same-id).
    if (isNewFamily) {
      const referral = getPendingReferral();
      if (referral) {
        const allFamilies = get<FamilyProfile[]>("families", []);
        const referrerFamilyId = await findFamilyIdByReferralCode(
          allFamilies.map((f) => f.id),
          referral.code,
        );
        if (referrerFamilyId) await recordReferral(referrerFamilyId, savedFamily.id);
        clearPendingReferral();
      }
    }

    if (recipientType === "elder") {
      const recipient = await addElderRecipient(savedFamily.id, { name: recipientName, notes: recipientNotes || undefined });
      setPendingBooking({ careRecipientId: recipient.id });
      setSubmitting(false);
      router.push(`/book/${providerId}/pay`);
    } else {
      // Child path goes through guardian consent — the child's details ride
      // in session state, not the URL, so a minor's PII never sits in the
      // address bar or history.
      setPendingChildRecipient({ familyId: savedFamily.id, name: recipientName, notes: recipientNotes });
      setSubmitting(false);
      router.push(`/book/${providerId}/consent`);
    }
  }

  return (
    <OnboardingFrame steps={["Choose your visit", "Your account", "Family details", "Confirm and pay"]} step={3} title="Care that knows the little things." description="Share the practical details that help a care professional understand your family’s day." image={recipientType === "child" ? "babysitting-storytime" : "elder-care-checkin"}>
      {pending && <BookingSummaryCard providerName={provider.name} pending={pending} />}

      <h1 className="text-xl font-semibold text-text-primary">Tell us who {provider.name} will be caring for.</h1>

      {recipients.length > 0 && (
        <div className="flex flex-col gap-2">
          {recipients.map((r) => (
            <Button key={r.id} variant="secondary" onClick={() => handleUseExisting(r)} fullWidth>
              Booking for {r.name} again? Yes, use this profile
            </Button>
          ))}
          <p className="text-center text-xs text-text-secondary">or add someone new below</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {!family && (
          <>
            <TextField label="Your name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Priya Sharma" />
            <TextAreaField label="Address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Flat 4B, Green Park" />
            <LocationPicker value={coords} onChange={setCoords} />
          </>
        )}

        <div>
          <p className="mb-2 text-sm font-medium text-text-primary">Who needs care?</p>
          <div className="flex gap-2">
            {(["elder", "child"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setRecipientType(t)}
                className={`min-h-tap flex-1 rounded-full border px-4 text-sm font-medium capitalize transition-colors ${
                  recipientType === t ? "border-accent bg-accent-tint text-accent-text" : "border-border text-text-secondary"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <TextField label="Their name" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="e.g. Dadi, or child's name" />
        <TextAreaField label="Notes (optional)" value={recipientNotes} onChange={(e) => setRecipientNotes(e.target.value)} placeholder="Anything the caregiver should know" />

        <Button type="submit" disabled={submitting || !recipientName || (!family && (!name || !address || !coords))} fullWidth>
          Continue
        </Button>
      </form>
    </OnboardingFrame>
  );
}

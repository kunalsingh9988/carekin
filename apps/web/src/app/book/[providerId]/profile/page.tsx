"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { useCurrentLocation } from "@/lib/hooks/useCurrentLocation";
import { getFamilyProfile, saveFamilyProfile, getCareRecipients, addElderRecipient } from "@/lib/storage/repositories/families";
import { getProviderPublic, type GuestSafeProvider } from "@/lib/storage/repositories/providers";
import { setPendingBooking, getPendingBooking } from "@/lib/storage/session";
import type { CareRecipient, CareRecipientType, FamilyProfile } from "@/lib/storage/types";
import { StepProgress } from "@/components/ui/StepProgress";
import { BookingSummaryCard } from "@/components/booking/BookingSummaryCard";
import { Button } from "@/components/ui/Button";
import { TextField, TextAreaField } from "@/components/ui/FormField";

export default function BookingProfilePage({ params }: { params: Promise<{ providerId: string }> }) {
  const { providerId } = use(params);
  const router = useRouter();
  const user = getCurrentUser();

  const [provider, setProvider] = useState<GuestSafeProvider | null>(null);
  const [family, setFamily] = useState<FamilyProfile | null>(null);
  const [recipients, setRecipients] = useState<CareRecipient[]>([]);
  const { coords, fetchLocation } = useCurrentLocation();

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [recipientType, setRecipientType] = useState<CareRecipientType>("elder");
  const [recipientName, setRecipientName] = useState("");
  const [recipientNotes, setRecipientNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      router.replace(`/book/${providerId}`);
      return;
    }
    getProviderPublic(providerId).then(setProvider);
    if (!getPendingBooking()) {
      router.replace(`/book/${providerId}`);
      return;
    }
    getFamilyProfile(user.id).then((f) => {
      setFamily(f);
      if (f) {
        setName(f.name);
        setAddress(f.address);
        getCareRecipients(f.id).then(setRecipients);
      } else {
        fetchLocation();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerId]);

  if (!user || !provider) return null;

  // Returning-family shortcut (Section 6.8) — an existing care recipient
  // means skip straight past the form entirely.
  async function handleUseExisting(recipient: CareRecipient) {
    setPendingBooking({ careRecipientId: recipient.id });
    router.push(`/book/${providerId}/pay`);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);

    const savedFamily = await saveFamilyProfile(user.id, {
      name,
      address,
      latitude: coords?.latitude ?? family?.latitude ?? 12.9352,
      longitude: coords?.longitude ?? family?.longitude ?? 77.6146,
    });

    if (recipientType === "elder") {
      const recipient = await addElderRecipient(savedFamily.id, { name: recipientName, notes: recipientNotes || undefined });
      setPendingBooking({ careRecipientId: recipient.id });
      setSubmitting(false);
      router.push(`/book/${providerId}/pay`);
    } else {
      setSubmitting(false);
      router.push(
        `/book/${providerId}/consent?familyId=${savedFamily.id}&name=${encodeURIComponent(recipientName)}&notes=${encodeURIComponent(recipientNotes)}`,
      );
    }
  }

  const pending = getPendingBooking();

  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col gap-6 px-6 py-8">
      <StepProgress step={3} total={4} label="Your details" />
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
          </>
        )}

        <div>
          <p className="mb-2 text-sm font-medium text-text-primary">Who needs care?</p>
          <div className="flex gap-2">
            <Button type="button" variant={recipientType === "elder" ? "primary" : "secondary"} onClick={() => setRecipientType("elder")}>
              Elder
            </Button>
            <Button type="button" variant={recipientType === "child" ? "primary" : "secondary"} onClick={() => setRecipientType("child")}>
              Child
            </Button>
          </div>
        </div>

        <TextField label="Their name" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="e.g. Dadi, or child's name" />
        <TextAreaField label="Notes (optional)" value={recipientNotes} onChange={(e) => setRecipientNotes(e.target.value)} placeholder="Anything the caregiver should know" />

        <Button type="submit" disabled={submitting || !recipientName || (!family && (!name || !address))} fullWidth>
          Continue
        </Button>
      </form>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { HeartHandshake, ShieldCheck } from "lucide-react";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { useCurrentLocation } from "@/lib/hooks/useCurrentLocation";
import { getFamilyProfile, saveFamilyProfile, addElderRecipient, addChildRecipientWithConsent } from "@/lib/storage/repositories/families";
import type { CareRecipientType, FamilyProfile } from "@/lib/storage/types";
import { StepProgress } from "@/components/ui/StepProgress";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TextField, TextAreaField } from "@/components/ui/FormField";

type Step = "about" | "recipient" | "done";

// Standalone family onboarding (Section 5.2): the booking funnel only
// builds a family profile mid-flow, so a family that signs up without
// booking first needs its own path — profile, then optionally the first
// care recipient (child recipients still take the logged-consent path,
// same DPDP rule as /book/[id]/consent).
export default function FamilyOnboardingPage() {
  const user = useRequireRole("family");
  const router = useRouter();
  const { coords, loading: locating, usedFallback, fetchLocation } = useCurrentLocation();

  const [existing, setExisting] = useState<FamilyProfile | null>(null);
  const [checked, setChecked] = useState(false);
  const [step, setStep] = useState<Step>("about");

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [family, setFamily] = useState<FamilyProfile | null>(null);

  const [recipientType, setRecipientType] = useState<CareRecipientType>("elder");
  const [recipientName, setRecipientName] = useState("");
  const [recipientNotes, setRecipientNotes] = useState("");
  const [consentChecked, setConsentChecked] = useState(false);
  const [recipientAdded, setRecipientAdded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    getFamilyProfile(user.id).then((f) => {
      setExisting(f);
      if (f) {
        // Already onboarded — profile exists, nothing to collect here.
        router.replace("/family");
      }
      setChecked(true);
    });
  }, [user, router]);

  if (!user || !checked) return null;
  if (existing) return null;

  async function handleAbout(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !address.trim()) {
      setError("Add your name and address to continue.");
      return;
    }
    if (!coords) {
      setError("Tap \"Use my current location\" so we can show caregivers near you.");
      return;
    }
    setSubmitting(true);
    const f = await saveFamilyProfile(user!.id, { name: name.trim(), address: address.trim(), latitude: coords.latitude, longitude: coords.longitude });
    setFamily(f);
    setSubmitting(false);
    setStep("recipient");
  }

  async function handleRecipient(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!family || !recipientName.trim()) return;
    setSubmitting(true);
    if (recipientType === "elder") {
      await addElderRecipient(family.id, { name: recipientName.trim(), notes: recipientNotes.trim() || undefined });
    } else {
      // DPDP: the guardian's identity is the logged-in user's own name —
      // consent is by the person filling this form, method is the checkbox.
      await addChildRecipientWithConsent(family.id, { name: recipientName.trim(), notes: recipientNotes.trim() || undefined }, { consentedBy: user!.id, consentedByName: name.trim(), method: "in_app_checkbox" });
    }
    setRecipientAdded(true);
    setSubmitting(false);
    setStep("done");
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-6 py-12">
      <StepProgress step={step === "about" ? 1 : step === "recipient" ? 2 : 3} total={3} label="Set up your family account" />

      {step === "about" && (
        <form onSubmit={handleAbout} className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-bold leading-2xl text-text-primary">Tell us about you</h1>
            <p className="mt-1 text-sm leading-sm text-text-secondary">
              Your details stay private — providers only see what they need once a booking is confirmed.
            </p>
          </div>

          <TextField label="Your name" placeholder="Priya Sharma" value={name} onChange={(e) => setName(e.target.value)} />
          <TextAreaField label="Address" placeholder="Flat, street, landmark" value={address} onChange={(e) => setAddress(e.target.value)} />

          <Button type="button" variant="secondary" onClick={fetchLocation} disabled={locating}>
            {coords ? (usedFallback ? "Using approximate location" : "Location saved") : locating ? "Locating…" : "Use my current location"}
          </Button>

          {error && <p className="text-sm text-danger">{error}</p>}

          <Button type="submit" disabled={submitting} fullWidth>Continue</Button>
        </form>
      )}

      {step === "recipient" && (
        <form onSubmit={handleRecipient} className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-bold leading-2xl text-text-primary">Who needs care?</h1>
            <p className="mt-1 text-sm leading-sm text-text-secondary">
              Add the person visits are for — you can add more later from your bookings.
            </p>
          </div>

          <div className="flex gap-2">
            {(["elder", "child"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setRecipientType(t)}
                className={`min-h-tap flex-1 rounded-full border px-3 text-sm font-medium transition-colors ${recipientType === t ? "border-accent bg-accent-tint text-accent-text" : "border-border text-text-secondary"}`}
              >
                {t === "elder" ? "A parent or elder" : "A child"}
              </button>
            ))}
          </div>

          <TextField
            label={recipientType === "elder" ? "Their name" : "Child's name"}
            placeholder={recipientType === "elder" ? "e.g. Amma, Ramesh" : "e.g. Aarav"}
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
          />
          <TextAreaField
            label="Anything the caregiver should know (optional)"
            placeholder={recipientType === "elder" ? "Mobility, medication reminders, languages…" : "Age, routine, allergies…"}
            value={recipientNotes}
            onChange={(e) => setRecipientNotes(e.target.value)}
          />

          {recipientType === "child" && (
            <label className="flex items-start gap-3 rounded-md border border-border bg-surface-secondary px-4 py-3">
              <input type="checkbox" checked={consentChecked} onChange={(e) => setConsentChecked(e.target.checked)} className="mt-1 h-4 w-4 accent-accent" />
              <span className="text-sm leading-sm text-text-secondary">
                I&apos;m {name.trim() || "the parent or guardian"}{" "}and I consent to CareKin storing my child&apos;s details
                so sitters can be booked for them.
              </span>
            </label>
          )}

          {error && <p className="text-sm text-danger">{error}</p>}

          <Button type="submit" disabled={!recipientName.trim() || (recipientType === "child" && !consentChecked) || submitting} fullWidth>
            {recipientType === "elder" ? "Add and finish" : "Consent and finish"}
          </Button>
          <button type="button" onClick={() => setStep("done")} className="min-h-tap rounded-md text-sm font-medium text-text-secondary">
            Skip — I&apos;ll add them when I book
          </button>
        </form>
      )}

      {step === "done" && (
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-bold leading-2xl text-text-primary">You&apos;re all set{name ? `, ${name.split(" ")[0]}` : ""}.</h1>
            <p className="mt-1 text-sm leading-sm text-text-secondary">
              Every provider on CareKin is ID-checked, police-verified, and interviewed before they appear.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Card className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-verified" />
              <p className="text-sm leading-sm text-text-secondary">Profiles are only visible to you until a booking is confirmed — no cold calls, no spam.</p>
            </Card>
            <Card className="flex items-start gap-3">
              <HeartHandshake className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              <p className="text-sm leading-sm text-text-secondary">
                {recipientAdded ? `${recipientName.trim()} is saved — pick a visit time and you're done.` : "Add a care recipient any time during booking."}
              </p>
            </Card>
          </div>

          <Link href="/search" className="min-h-tap flex items-center justify-center rounded-md bg-accent px-6 text-base font-semibold text-white transition-colors hover:bg-accent-text">
            Find verified care near you
          </Link>
          <Link href="/family" className="min-h-tap flex items-center justify-center rounded-md text-sm font-medium text-text-secondary">
            Go to my dashboard
          </Link>
        </div>
      )}
    </main>
  );
}

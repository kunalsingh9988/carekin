"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { useCurrentLocation } from "@/lib/hooks/useCurrentLocation";
import { saveFamilyProfile, addElderRecipient } from "@/lib/storage/repositories/families";
import { FamilyProfileSchema, type FamilyProfileFormValues } from "@/lib/validation/schemas";
import { Button } from "@/components/ui/Button";
import { TextField, TextAreaField } from "@/components/ui/FormField";

export default function FamilyOnboardingPage() {
  const user = useRequireRole("family");
  const router = useRouter();
  const { coords, loading: locating, usedFallback, fetchLocation } = useCurrentLocation();
  const [recipientType, setRecipientType] = useState<"elder" | "child">("elder");
  const [recipientName, setRecipientName] = useState("");
  const [recipientNotes, setRecipientNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FamilyProfileFormValues>({ resolver: zodResolver(FamilyProfileSchema) });

  useEffect(() => {
    if (coords) {
      setValue("latitude", coords.latitude);
      setValue("longitude", coords.longitude);
    }
  }, [coords, setValue]);

  if (!user) return null;

  function handleUseLocation() {
    fetchLocation();
  }

  async function onSubmit(values: FamilyProfileFormValues) {
    if (!coords) return;
    setSubmitting(true);
    const family = await saveFamilyProfile(user!.id, { ...values, latitude: coords.latitude, longitude: coords.longitude });

    if (recipientType === "elder") {
      await addElderRecipient(family.id, { name: recipientName, notes: recipientNotes || undefined });
      router.push("/family/search");
    } else {
      router.push(
        `/family/onboarding/consent?familyId=${family.id}&name=${encodeURIComponent(recipientName)}&notes=${encodeURIComponent(recipientNotes)}`,
      );
    }
  }

  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col justify-center gap-6 px-6 py-16">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Tell us about your family</h1>
        <p className="mt-1 text-sm text-text-secondary">Set up your profile and add who needs care.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <TextField label="Your name" placeholder="Priya Sharma" {...register("name")} error={errors.name?.message} />
        <TextAreaField label="Address" placeholder="Flat 4B, Green Park" {...register("address")} error={errors.address?.message} />

        <Button type="button" variant="secondary" onClick={handleUseLocation} disabled={locating}>
          {coords ? (usedFallback ? "Using approximate location" : "Location saved") : locating ? "Locating…" : "Use my current location"}
        </Button>

        <div className="mt-2 border-t border-border pt-4">
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

        <TextField label="Their name" placeholder="e.g. Dadi, or child's name" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} />
        <TextAreaField label="Notes (optional)" placeholder="Anything a caregiver should know" value={recipientNotes} onChange={(e) => setRecipientNotes(e.target.value)} />

        <Button type="submit" disabled={!coords || !recipientName || submitting} fullWidth>
          {recipientType === "child" ? "Continue to guardian consent" : "Finish setup"}
        </Button>
      </form>
    </main>
  );
}

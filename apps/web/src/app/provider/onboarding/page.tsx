"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { useCurrentLocation } from "@/lib/hooks/useCurrentLocation";
import { createProviderProfile, getMyProvider, getDocuments } from "@/lib/storage/repositories/providers";
import { ProviderProfileSchema, type ProviderProfileFormValues } from "@/lib/validation/schemas";
import { Button } from "@/components/ui/Button";
import { OnboardingFrame } from "@/components/onboarding/OnboardingFrame";
import { TextField, TextAreaField, SelectField } from "@/components/ui/FormField";

export default function ProviderOnboardingPage() {
  const user = useRequireRole("provider");
  const router = useRouter();
  const { coords, loading: locating, usedFallback, fetchLocation } = useCurrentLocation();
  const [usePilotArea, setUsePilotArea] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProviderProfileFormValues>({
    resolver: zodResolver(ProviderProfileSchema),
    defaultValues: { type: "caregiver", serviceRadiusKm: 5, phone: user?.phone ?? "+91" },
  });
  const careType = useWatch({ control, name: "type" });

  useEffect(() => {
    if (!user) return;
    // Pre-fill the phone once the session resolves — defaultValues is
    // captured on first render, before useRequireRole finishes.
    setValue("phone", user.phone);
    getMyProvider(user.id).then(async (p) => {
      if (!p) return;
      const documents = await getDocuments(p.id);
      router.replace(documents.some((doc) => doc.type === "id_proof") && documents.some((doc) => doc.type === "address_proof") ? "/provider/verification-status" : "/provider/onboarding/documents");
    });
  }, [user, router, setValue]);

  useEffect(() => {
    if (coords) {
      setValue("latitude", coords.latitude);
      setValue("longitude", coords.longitude);
    }
  }, [coords, setValue]);

  if (!user) return null;

  async function onSubmit(values: ProviderProfileFormValues) {
    if (!coords && !usePilotArea) return;
    const at = coords ?? { latitude: 12.9352, longitude: 77.6146 };
    await createProviderProfile(user!.id, { ...values, latitude: at.latitude, longitude: at.longitude });
    router.push("/provider/onboarding/documents");
  }

  return (
    <OnboardingFrame steps={["Your care profile", "Documents and identity", "Application status"]} step={1} title="Bring your care. Build meaningful connections." description="Introduce yourself to families looking for thoughtful, dependable support. Your profile stays private until the review is complete." image={careType === "babysitter" ? "babysitting-storytime" : "caregiver-arrival"}>
      <div>
        <h1 className="text-2xl font-bold leading-2xl text-text-primary">Set up your provider profile</h1>
        <p className="mt-1 text-sm leading-sm text-text-secondary">You won&apos;t be visible to families until our team verifies you.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <SelectField label="I am a…" {...register("type")} error={errors.type?.message}>
          <option value="caregiver">Elder caregiver</option>
          <option value="babysitter">Babysitter</option>
        </SelectField>

        <TextField label="Full name" placeholder="Sunita Rao" {...register("name")} error={errors.name?.message} />
        <TextField label="Phone" {...register("phone")} error={errors.phone?.message} />
        <TextAreaField label="Bio" placeholder="Your experience, availability, languages" {...register("bio")} error={errors.bio?.message} />
        <TextField label="Service radius (km)" type="number" {...register("serviceRadiusKm")} error={errors.serviceRadiusKm?.message} />

        <Button type="button" variant="secondary" onClick={fetchLocation} disabled={locating}>
          {coords ? (usedFallback ? "Using approximate location" : "Location saved") : locating ? "Locating…" : "Use my current location"}
        </Button>

        <button type="button" onClick={() => { setUsePilotArea(true); setValue("latitude", 12.9352); setValue("longitude", 77.6146); }} className="min-h-tap rounded-md bg-accent-tint px-4 text-sm font-medium text-accent-text">{usePilotArea ? "Koramangala demo area selected" : "Use Koramangala demo area instead"}</button>

        <Button type="submit" disabled={(!coords && !usePilotArea) || isSubmitting} fullWidth>
          Continue to documents
        </Button>
      </form>
    </OnboardingFrame>
  );
}

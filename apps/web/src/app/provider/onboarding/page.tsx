"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { useCurrentLocation } from "@/lib/hooks/useCurrentLocation";
import { createProviderProfile, getMyProvider } from "@/lib/storage/repositories/providers";
import { ProviderProfileSchema, type ProviderProfileFormValues } from "@/lib/validation/schemas";
import { Button } from "@/components/ui/Button";
import { TextField, TextAreaField, SelectField } from "@/components/ui/FormField";

export default function ProviderOnboardingPage() {
  const user = useRequireRole("provider");
  const router = useRouter();
  const { coords, loading: locating, usedFallback, fetchLocation } = useCurrentLocation();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProviderProfileFormValues>({
    resolver: zodResolver(ProviderProfileSchema),
    defaultValues: { type: "caregiver", serviceRadiusKm: 5, phone: user?.phone ?? "+91" },
  });

  useEffect(() => {
    if (!user) return;
    // Pre-fill the phone once the session resolves — defaultValues is
    // captured on first render, before useRequireRole finishes.
    setValue("phone", user.phone);
    getMyProvider(user.id).then((p) => {
      if (p) router.replace("/provider/verification-status");
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
    if (!coords) return;
    await createProviderProfile(user!.id, { ...values, latitude: coords.latitude, longitude: coords.longitude });
    router.push("/provider/onboarding/documents");
  }

  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col justify-center gap-6 px-6 py-16">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Set up your provider profile</h1>
        <p className="mt-1 text-sm text-text-secondary">You won&apos;t be visible to families until our team verifies you.</p>
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

        <Button type="submit" disabled={!coords || isSubmitting} fullWidth>
          Continue to documents
        </Button>
      </form>
    </main>
  );
}

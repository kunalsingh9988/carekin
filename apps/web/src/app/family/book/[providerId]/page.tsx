"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { getFamilyProfile, getCareRecipients } from "@/lib/storage/repositories/families";
import { getProvider } from "@/lib/storage/repositories/providers";
import { createBooking } from "@/lib/storage/repositories/bookings";
import { BookingSchema, type BookingFormValues } from "@/lib/validation/schemas";
import type { CareRecipient, FamilyProfile, Provider } from "@/lib/storage/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TextField, SelectField } from "@/components/ui/FormField";

const HOURLY_RATE_PAISE = 60000; // ~₹600/hr, matches the pricing page's stated range

export default function BookingPage({ params }: { params: Promise<{ providerId: string }> }) {
  const { providerId } = use(params);
  const user = useRequireRole("family");
  const router = useRouter();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [family, setFamily] = useState<FamilyProfile | null>(null);
  const [recipients, setRecipients] = useState<CareRecipient[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<BookingFormValues>({ resolver: zodResolver(BookingSchema), defaultValues: { durationHours: 2 } });

  const durationHours = watch("durationHours") || 0;
  const amountPaise = Math.round(HOURLY_RATE_PAISE * Number(durationHours || 0));

  useEffect(() => {
    getProvider(providerId).then(setProvider);
    if (!user) return;
    getFamilyProfile(user.id).then((f) => {
      setFamily(f);
      if (f) getCareRecipients(f.id).then(setRecipients);
    });
  }, [providerId, user]);

  if (!user) return null;

  async function onSubmit(values: BookingFormValues) {
    if (!family) return;
    setSubmitting(true);
    const scheduledAt = new Date(`${values.scheduledDate}T${values.scheduledTime}:00`).toISOString();
    const booking = await createBooking({
      familyId: family.id,
      providerId,
      careRecipientId: values.careRecipientId,
      type: "one_off",
      scheduledAt,
      durationHours: values.durationHours,
      amountPaise,
    });
    router.push(`/family/book/${providerId}/payment?bookingId=${booking.id}`);
  }

  if (!family) {
    return (
      <main className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="text-text-secondary">Finish your family profile before booking.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col gap-6 px-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Request a booking</h1>
        {provider && <p className="text-sm text-text-secondary">with {provider.name}</p>}
      </div>

      {recipients.length === 0 ? (
        <p className="text-sm text-text-secondary">
          You don&apos;t have any care recipients yet — add one from your{" "}
          <a href="/family/settings" className="text-accent-text underline">
            settings
          </a>
          .
        </p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <SelectField label="Who is this for?" {...register("careRecipientId")} error={errors.careRecipientId?.message}>
            <option value="">Select…</option>
            {recipients.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </SelectField>

          <div className="flex gap-3">
            <TextField label="Date" type="date" {...register("scheduledDate")} error={errors.scheduledDate?.message} />
            <TextField label="Time" type="time" {...register("scheduledTime")} error={errors.scheduledTime?.message} />
          </div>

          <TextField label="Duration (hours)" type="number" step="0.5" min="1" {...register("durationHours")} error={errors.durationHours?.message} />

          <Card className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Estimated total</span>
            <span className="text-lg font-semibold text-text-primary">₹{(amountPaise / 100).toFixed(0)}</span>
          </Card>

          <Button type="submit" disabled={submitting} fullWidth>
            {submitting ? "Requesting…" : "Continue to payment"}
          </Button>
        </form>
      )}
    </main>
  );
}

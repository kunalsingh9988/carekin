"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Star } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { getBooking } from "@/lib/storage/repositories/bookings";
import { getProvider } from "@/lib/storage/repositories/providers";
import { getFamilyProfile } from "@/lib/storage/repositories/families";
import { submitReview } from "@/lib/storage/repositories/reviews";
import { REFERRAL_BONUS_PAISE } from "@/lib/storage/repositories/referrals";
import { ReviewSchema, type ReviewFormValues } from "@/lib/validation/schemas";
import type { Booking, Provider } from "@/lib/storage/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TextAreaField } from "@/components/ui/FormField";

export default function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const user = useRequireRole("family");
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null | undefined>(undefined);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [rating, setRating] = useState(5);
  const [submitted, setSubmitted] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ReviewFormValues>({
    resolver: zodResolver(ReviewSchema),
    defaultValues: { rating: 5 },
  });

  useEffect(() => {
    if (!user) return;
    getBooking(id).then(async (b) => {
      // Only for completed bookings the family actually owns (Section 4) —
      // enforced here, not just hidden in the UI.
      const family = b ? await getFamilyProfile(user.id) : null;
      if (!b || !family || b.family_id !== family.id || b.status !== "completed") {
        router.replace(`/family/bookings/${id}`);
        return;
      }
      setBooking(b);
      getProvider(b.provider_id).then(setProvider);
    });
  }, [id, user, router]);

  if (!user || !booking) return null;

  async function onSubmit(values: ReviewFormValues) {
    if (!booking) return;
    await submitReview(booking.id, booking.provider_id, rating, values.comment);
    // Referral ask comes AFTER a positive action, not embedded in the form
    // itself (Section 4, Step 9 CRO rationale) — hence the separate state.
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <main className="mx-auto flex max-w-md flex-1 flex-col justify-center gap-6 px-6 py-16 text-center">
        <h1 className="text-xl font-semibold text-text-primary">Thank you — this helps other families choose with confidence.</h1>
        <Card className="flex flex-col gap-2">
          <p className="text-sm text-text-primary">
            Loved your experience? Share CareKin with a friend and you&apos;ll both get ₹{(REFERRAL_BONUS_PAISE / 100).toFixed(0)}{" "}
            off.
          </p>
          <Link href="/family/referrals" className="min-h-tap flex items-center justify-center rounded-md bg-accent text-sm font-semibold text-white">
            Refer a friend
          </Link>
        </Card>
        <Link href={`/family/bookings/${id}`} className="text-sm text-text-secondary underline">
          Back to booking
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col justify-center gap-6 px-6 py-16">
      <h1 className="text-2xl font-semibold text-text-primary">How was your visit with {provider?.name ?? "your provider"}?</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex justify-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <button key={i} type="button" onClick={() => setRating(i + 1)} aria-label={`${i + 1} stars`}>
              <Star className={`h-8 w-8 ${i < rating ? "fill-verified text-verified" : "text-border"}`} />
            </button>
          ))}
        </div>
        <input type="hidden" {...register("rating", { valueAsNumber: true })} value={rating} readOnly />
        {errors.rating && <p className="text-center text-sm text-danger">{errors.rating.message}</p>}

        <TextAreaField label="Comment (optional)" placeholder="How did it go?" {...register("comment")} error={errors.comment?.message} />

        <Button type="submit" disabled={isSubmitting} fullWidth>
          Submit review
        </Button>
      </form>
    </main>
  );
}

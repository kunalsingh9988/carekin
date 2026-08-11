"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { getBooking } from "@/lib/storage/repositories/bookings";
import { submitReview } from "@/lib/storage/repositories/reviews";
import { ReviewSchema, type ReviewFormValues } from "@/lib/validation/schemas";
import type { Booking } from "@/lib/storage/types";
import { Button } from "@/components/ui/Button";
import { TextAreaField } from "@/components/ui/FormField";

export default function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const user = useRequireRole("family");
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [rating, setRating] = useState(5);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ReviewFormValues>({
    resolver: zodResolver(ReviewSchema),
    defaultValues: { rating: 5 },
  });

  useEffect(() => {
    getBooking(id).then(setBooking);
  }, [id]);

  if (!user) return null;
  // Only for completed bookings (Section 4) — enforced here, not just hidden in the UI.
  if (booking && booking.status !== "completed") {
    router.replace(`/family/bookings/${id}`);
    return null;
  }

  async function onSubmit(values: ReviewFormValues) {
    if (!booking) return;
    await submitReview(booking.id, booking.provider_id, rating, values.comment);
    router.push(`/family/bookings/${id}`);
  }

  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col justify-center gap-6 px-6 py-16">
      <h1 className="text-2xl font-semibold text-text-primary">Leave a review</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex justify-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <button key={i} type="button" onClick={() => setRating(i + 1)} aria-label={`${i + 1} stars`}>
              <Star className={`h-8 w-8 ${i < rating ? "fill-warning text-warning" : "text-border"}`} />
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

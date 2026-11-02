"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Star } from "lucide-react";
import { getProviderPublic, type GuestSafeProvider } from "@/lib/storage/repositories/providers";
import { getReviewsForProvider } from "@/lib/storage/repositories/reviews";
import { oneOffVisitPricePaise, weeklyPlanPricePaise } from "@/lib/business";
import type { Review } from "@/lib/storage/types";
import { Card } from "@/components/ui/Card";
import { ProviderAvatar } from "@/components/ui/ProviderAvatar";
import { VerificationTrail } from "@/components/verification/VerificationTrail";

// Public, guest-safe, and standalone-shareable (Section 5.2) — this is the
// page a word-of-mouth link should land on, not a login screen.
export default function ProviderProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [provider, setProvider] = useState<GuestSafeProvider | null | undefined>(undefined);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    getProviderPublic(id).then((p) => {
      setProvider(p);
      if (p) getReviewsForProvider(p.id).then(setReviews);
    });
  }, [id]);

  if (provider === null) notFound();
  if (provider === undefined) return null;

  const avgRating = reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : null;
  const visitPrice = oneOffVisitPricePaise();
  const weeklyPerVisit = Math.round(weeklyPlanPricePaise() / 3);

  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col gap-6 px-6 py-8 pb-28">
      {/* 4:3 image well on Mist — photography's stand-in while providers
          have no photos (initials monogram per design system). */}
      <div className="flex aspect-[4/3] max-h-64 w-full items-center justify-center rounded-lg bg-surface-secondary">
        <ProviderAvatar name={provider.name} size="lg" />
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-text-secondary">
          {provider.type === "caregiver" ? "Elder caregiver" : "Babysitter"}
        </p>
        <h1 className="text-4xl font-bold leading-4xl text-text-primary">{provider.name}</h1>
        {avgRating !== null ? (
          <p className="rating mt-1 flex items-center gap-1 text-sm font-medium text-verified">
            <Star className="h-4 w-4 fill-verified" />
            {avgRating.toFixed(1)} · {reviews.length} visit{reviews.length === 1 ? "" : "s"}
          </p>
        ) : (
          <p className="mt-1 text-sm text-text-secondary">New to CareKin</p>
        )}
      </div>

      {provider.bio && <p className="text-base leading-base text-text-primary">{provider.bio}</p>}

      <Card>
        <p className="mb-3 font-semibold text-text-primary">Verification</p>
        <VerificationTrail status={provider.verification_status} size="full" />
      </Card>

      {reviews.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="font-semibold text-text-primary">Reviews</p>
          {reviews.map((r) => (
            <Card key={r.id} className="flex flex-col gap-1">
              <div className="flex items-center gap-1 text-verified">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-verified" : "fill-border"}`} />
                ))}
              </div>
              {r.comment && <p className="text-sm leading-sm text-text-secondary">{r.comment}</p>}
            </Card>
          ))}
        </div>
      )}

      {/* Sticky CTA — price + struck original beside the single violet
          action, exactly the brand's book-now row. */}
      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-surface px-4 pb-4 pt-3">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
          <div>
            <p className="price text-base font-bold text-text-primary">
              ₹{(weeklyPerVisit / 100).toFixed(0)}
              <span className="ml-1.5 text-sm font-normal text-text-secondary line-through">₹{(visitPrice / 100).toFixed(0)}</span>
            </p>
            <p className="text-xs leading-sm text-text-secondary">per visit on a weekly plan</p>
          </div>
          <Link
            href={`/book/${provider.id}`}
            className="min-h-tap flex flex-1 items-center justify-center rounded-md bg-accent text-base font-semibold text-white transition-colors hover:bg-accent-text sm:flex-none sm:px-8"
          >
            Book now
          </Link>
        </div>
      </div>
    </main>
  );
}

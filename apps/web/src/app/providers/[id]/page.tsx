"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Star } from "lucide-react";
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
  const childcare = provider.type === "babysitter";
  const photos = childcare ? [
    { file: "babysitting-storytime", alt: "A sitter and child enjoying story time at home" },
    { file: "hero-family-care", alt: "A family spending time together at home" },
    { file: "family-peace", alt: "A father and son sharing a quiet moment" },
  ] : [
    { file: "elder-care-checkin", alt: "A caregiver helping an elder with his daily routine" },
    { file: "caregiver-arrival", alt: "A care professional arriving at a home" },
    { file: "hero-family-care", alt: "A caregiver supporting an older woman with her family" },
  ];

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 pb-32 sm:px-6 sm:py-8 sm:pb-32">
      <Link href={`/search?type=${provider.type}`} className="inline-flex min-h-tap items-center gap-2 self-start text-sm font-semibold text-accent-text"><ArrowLeft className="h-4 w-4" />Back to {childcare ? "babysitters" : "elder caregivers"}</Link>
      <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
        <div className="relative min-h-64 overflow-hidden rounded-lg bg-surface-secondary sm:row-span-2 sm:min-h-96">
          <Image src={`/images/carekin/${photos[0].file}.webp`} alt={`Illustrative care scene: ${photos[0].alt}`} fill priority sizes="(max-width: 639px) 100vw, 66vw" className={`object-cover ${childcare ? "object-[center_40%]" : "object-center"}`} />
          <span className="absolute bottom-3 left-3 rounded-md bg-ink px-3 py-1.5 text-xs text-white">{childcare ? "Childcare" : "Elder care"} · Illustrative care scene</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-1 sm:row-span-2">
          {photos.slice(1).map((photo) => <div key={photo.file} className="relative min-h-32 overflow-hidden rounded-lg bg-surface-secondary sm:min-h-44"><Image src={`/images/carekin/${photo.file}.webp`} alt={`Illustrative care scene: ${photo.alt}`} fill sizes="(max-width: 639px) 50vw, 33vw" className={`object-cover ${photo.file === "caregiver-arrival" ? "object-top" : "object-center"}`} /><span className="absolute bottom-2 right-2 rounded-md bg-ink px-2 py-1 text-xs text-white">Illustrative scene</span></div>)}
        </div>
      </div>
      <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:gap-12">
      <div className="flex min-w-0 flex-col gap-6">
      <div className="flex items-center gap-4"><ProviderAvatar name={provider.name} size="lg" />
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
      </div>

      {provider.bio && <p className="text-base leading-base text-text-primary">{provider.bio}</p>}

      {reviews.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl font-semibold text-text-primary">Visit reviews</h2>
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
      {reviews.length === 0 && <div className="border-t border-border pt-5"><h2 className="text-lg font-semibold text-text-primary">Visit reviews</h2><p className="mt-2 text-sm leading-sm text-text-secondary">No visit reviews yet. You can leave a review after a completed booking.</p></div>}
      </div>
      <aside className="flex flex-col gap-5 rounded-lg border border-border bg-surface p-5 sm:p-6 lg:self-start">
        <h2 className="text-2xl font-semibold text-text-primary">Verification</h2>
        <VerificationTrail status={provider.verification_status} size="full" />
        <Link href="/how-it-works" className="inline-flex items-center gap-2 text-sm font-semibold text-accent-text">How verification works <ArrowRight className="h-4 w-4" /></Link>
        <div className="border-t border-border pt-5"><h3 className="font-semibold text-text-primary">Your visit, your choice</h3><p className="mt-2 text-sm leading-sm text-text-secondary">Choose a one-off visit or a weekly plan on the next step. Review your schedule and total before payment.</p><p className="price mt-3 text-sm text-text-secondary">One-off visit: ₹{(visitPrice / 100).toFixed(0)}</p></div>
      </aside>
      </div>

      {/* Sticky CTA — price + struck original beside the single violet
          action, exactly the brand's book-now row. */}
      <div className="safe-bottom-bar fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface px-4 pb-4 pt-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
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

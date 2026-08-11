"use client";

import { use, useEffect, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { getProvider } from "@/lib/storage/repositories/providers";
import { getReviewsForProvider } from "@/lib/storage/repositories/reviews";
import type { Provider, Review } from "@/lib/storage/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { VerificationTrail } from "@/components/verification/VerificationTrail";

export default function ProviderProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const user = useRequireRole("family");
  const router = useRouter();
  const [provider, setProvider] = useState<Provider | null | undefined>(undefined);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    getProvider(id).then((p) => {
      setProvider(p);
      if (p) getReviewsForProvider(p.id).then(setReviews);
    });
  }, [id]);

  if (!user) return null;
  if (provider === null) notFound();
  if (provider === undefined) return null;

  const avgRating = reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : null;

  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col gap-6 px-6 py-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
          {provider.type === "caregiver" ? "Elder caregiver" : "Babysitter"}
        </p>
        <h1 className="text-2xl font-semibold text-text-primary">{provider.name}</h1>
        {avgRating !== null && (
          <div className="mt-1 flex items-center gap-1 text-sm text-text-secondary">
            <Star className="h-4 w-4 fill-warning text-warning" />
            {avgRating.toFixed(1)} ({reviews.length} review{reviews.length === 1 ? "" : "s"})
          </div>
        )}
      </div>

      {provider.bio && <p className="text-text-primary">{provider.bio}</p>}

      <Card>
        <p className="mb-3 font-medium text-text-primary">Verification</p>
        <VerificationTrail status={provider.verification_status} size="full" />
      </Card>

      {reviews.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="font-medium text-text-primary">Reviews</p>
          {reviews.map((r) => (
            <Card key={r.id} className="flex flex-col gap-1">
              <div className="flex items-center gap-1 text-warning">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-warning" : ""}`} />
                ))}
              </div>
              {r.comment && <p className="text-sm text-text-secondary">{r.comment}</p>}
            </Card>
          ))}
        </div>
      )}

      <Button onClick={() => router.push(`/family/book/${provider.id}`)} fullWidth>
        Request a booking
      </Button>
    </main>
  );
}

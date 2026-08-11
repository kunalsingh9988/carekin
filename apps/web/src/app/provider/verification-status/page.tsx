"use client";

import { useEffect, useState } from "react";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { getMyProvider, getVerificationStatus } from "@/lib/storage/repositories/providers";
import type { Provider, VerificationReview } from "@/lib/storage/types";
import { Card } from "@/components/ui/Card";
import { VerificationChip } from "@/components/verification/VerificationChip";
import { VerificationTrail } from "@/components/verification/VerificationTrail";

export default function VerificationStatusPage() {
  const user = useRequireRole("provider");
  const [provider, setProvider] = useState<Provider | null | undefined>(undefined);
  const [reviews, setReviews] = useState<VerificationReview[]>([]);

  useEffect(() => {
    if (!user) return;
    getMyProvider(user.id).then((p) => {
      setProvider(p);
      if (p) getVerificationStatus(p.id).then((v) => setReviews(v.reviews));
    });
  }, [user]);

  if (!user) return null;
  if (provider === undefined) return null;
  if (provider === null) {
    return (
      <main className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="text-text-secondary">You haven&apos;t set up your provider profile yet.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col gap-6 px-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Verification status</h1>
        <div className="mt-1">
          <VerificationChip status={provider.verification_status} />
        </div>
      </div>

      <Card>
        <VerificationTrail status={provider.verification_status} size="full" />
      </Card>

      {provider.verification_status === "rejected" && (
        <Card className="border-danger">
          <p className="text-sm font-medium text-danger">Why this happened</p>
          <p className="mt-1 text-sm text-text-secondary">{reviews.find((r) => r.to_status === "rejected")?.reason}</p>
        </Card>
      )}

      {provider.verification_status === "approved" && (
        <p className="text-sm text-text-secondary">You&apos;re verified and visible to nearby families.</p>
      )}
      {provider.verification_status === "pending" && (
        <p className="text-sm text-text-secondary">
          Our team is reviewing your documents and background check. This usually takes a few days.
        </p>
      )}
    </main>
  );
}

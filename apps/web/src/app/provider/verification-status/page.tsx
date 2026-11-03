"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { OnboardingFrame } from "@/components/onboarding/OnboardingFrame";
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
        <Link href="/provider/onboarding" className="mt-4 text-accent-text">Start your care profile</Link>
      </main>
    );
  }

  return (
    <OnboardingFrame steps={["Your care profile", "Documents and identity", "Application status"]} step={3} title={provider.verification_status === "approved" ? "Ready to make a difference." : "Your next chapter in care starts here."} description="Your application status and review history stay here, so you always know where things stand." image={provider.type === "babysitter" ? "babysitting-storytime" : "caregiver-arrival"}>
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
      <Link href="/provider" className="flex min-h-tap items-center justify-center rounded-md bg-accent px-5 text-sm font-semibold text-white">Go to my dashboard</Link>
      {provider.verification_status === "pending" && <Link href="/provider/onboarding/documents" className="text-center text-sm font-semibold text-accent-text">Review application documents</Link>}
    </OnboardingFrame>
  );
}

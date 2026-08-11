"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search as SearchIcon } from "lucide-react";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { getFamilyProfile } from "@/lib/storage/repositories/families";
import { listApprovedProviders, type ProviderWithDistance } from "@/lib/storage/repositories/providers";
import type { FamilyProfile, ProviderType } from "@/lib/storage/types";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { VerificationChip } from "@/components/verification/VerificationChip";
import { VerificationTrail } from "@/components/verification/VerificationTrail";

export default function FamilySearchPage() {
  const user = useRequireRole("family");
  const [family, setFamily] = useState<FamilyProfile | null>(null);
  const [serviceType, setServiceType] = useState<ProviderType>("caregiver");
  const [results, setResults] = useState<ProviderWithDistance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getFamilyProfile(user.id).then(setFamily);
  }, [user]);

  useEffect(() => {
    if (!family) return;
    setLoading(true);
    listApprovedProviders({ type: serviceType, latitude: family.latitude, longitude: family.longitude, radiusKm: 15 })
      .then(setResults)
      .finally(() => setLoading(false));
  }, [family, serviceType]);

  if (!user) return null;

  if (!family) {
    return (
      <main className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-text-secondary">
          Finish{" "}
          <Link href="/family/onboarding" className="text-accent-text underline">
            setting up your family profile
          </Link>{" "}
          to search for providers.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col gap-4 px-6 py-8">
      <div className="flex gap-2">
        <TypeChip label="Elder care" active={serviceType === "caregiver"} onClick={() => setServiceType("caregiver")} />
        <TypeChip label="Babysitting" active={serviceType === "babysitter"} onClick={() => setServiceType("babysitter")} />
      </div>

      {loading && <p className="text-sm text-text-secondary">Finding verified providers nearby…</p>}

      {!loading && results.length === 0 && (
        <EmptyState
          icon={SearchIcon}
          title="No verified providers within 15km yet"
          body="This neighborhood is still growing — check back soon, or try the other service type."
        />
      )}

      <div className="flex flex-col gap-3">
        {results.map((p) => (
          <Link key={p.id} href={`/family/providers/${p.id}`}>
            <Card className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-text-primary">{p.name}</p>
                  <VerificationChip status={p.verification_status} />
                </div>
                <p className="text-sm text-text-secondary">{p.distance_km.toFixed(1)} km away</p>
                {p.bio && (
                  <p className="mt-1 line-clamp-2 text-sm text-text-secondary">{p.bio}</p>
                )}
              </div>
              <VerificationTrail status={p.verification_status} size="micro" />
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}

function TypeChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`min-h-tap flex-1 rounded-md border px-3 text-sm font-medium ${active ? "border-accent bg-accent text-white" : "border-border text-text-secondary"}`}
    >
      {label}
    </button>
  );
}

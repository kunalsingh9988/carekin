"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Search as SearchIcon, Star } from "lucide-react";
import { useCurrentLocation } from "@/lib/hooks/useCurrentLocation";
import { listApprovedProviders, type GuestSafeProviderWithDistance } from "@/lib/storage/repositories/providers";
import { getRatingSummary } from "@/lib/storage/repositories/reviews";
import { oneOffVisitPricePaise, weeklyPlanPricePaise } from "@/lib/business";
import type { ProviderType } from "@/lib/storage/types";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { VerificationChip } from "@/components/verification/VerificationChip";

// Public, guest-accessible (Section 5.2) — no login wall before a first-time
// visitor sees real, trustworthy content. listApprovedProviders() already
// strips phone/exact coordinates and filters to approved-only internally.
export default function SearchPage() {
  const { coords, fetchLocation } = useCurrentLocation();
  const [serviceType, setServiceType] = useState<ProviderType>("caregiver");
  const [results, setResults] = useState<(GuestSafeProviderWithDistance & { avgRating: number; reviewCount: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifyRequested, setNotifyRequested] = useState(false);

  useEffect(() => {
    fetchLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!coords) return;
    setLoading(true);
    listApprovedProviders({ type: serviceType, latitude: coords.latitude, longitude: coords.longitude, radiusKm: 15 })
      .then(async (providers) => {
        const withRatings = await Promise.all(
          providers.map(async (p) => {
            const { avg, count } = await getRatingSummary(p.id);
            return { ...p, avgRating: avg, reviewCount: count };
          }),
        );
        setResults(withRatings);
      })
      .finally(() => setLoading(false));
  }, [coords, serviceType]);

  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col gap-4 px-6 py-8">
      <div className="flex gap-2">
        <TypeChip label="Elder care" active={serviceType === "caregiver"} onClick={() => setServiceType("caregiver")} />
        <TypeChip label="Babysitting" active={serviceType === "babysitter"} onClick={() => setServiceType("babysitter")} />
      </div>

      {!loading && coords && (
        <p className="text-sm text-text-secondary">
          {results.length} verified caregiver{results.length === 1 ? "" : "s"} near your area · <span className="font-medium">Recommended</span>
        </p>
      )}

      {loading && <p className="text-sm text-text-secondary">Finding verified caregivers near you…</p>}

      {!loading && results.length === 0 && (
        <EmptyState
          icon={SearchIcon}
          title="No verified caregivers within 15km yet."
          body="CareKin is live in a few neighborhoods so far. Tell us where you need care and we'll message you the day we verify someone nearby."
          action={
            <button
              onClick={() => setNotifyRequested(true)}
              disabled={notifyRequested}
              className="min-h-tap mt-2 flex items-center gap-2 rounded-md bg-accent px-5 text-sm font-semibold text-white disabled:opacity-60"
            >
              <Bell className="h-4 w-4" /> {notifyRequested ? "We'll notify you" : "Notify me"}
            </button>
          }
        />
      )}

      <div className="flex flex-col gap-3">
        {results.map((p) => {
          const price = oneOffVisitPricePaise();
          const weeklyPrice = weeklyPlanPricePaise();
          return (
            <Link key={p.id} href={`/providers/${p.id}`}>
              <Card className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-text-primary">{p.name}</p>
                    <VerificationChip status={p.verification_status} />
                  </div>
                  <p className="text-sm text-text-secondary">
                    {p.reviewCount > 0 ? (
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                        {p.avgRating.toFixed(1)} ({p.reviewCount} visit{p.reviewCount === 1 ? "" : "s"}) ·{" "}
                      </span>
                    ) : null}
                    {p.distance_km.toFixed(1)} km away
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-accent-text">
                    From ₹{(price / 100).toFixed(0)}/visit · ₹{(weeklyPrice / 100).toFixed(0)}/week
                  </p>
                </div>
                <span className="min-h-tap flex shrink-0 items-center rounded-md border border-border px-4 text-sm font-medium text-text-primary">
                  View profile
                </span>
              </Card>
            </Link>
          );
        })}
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

"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Bell, Search as SearchIcon, Star } from "lucide-react";
import { useCurrentLocation } from "@/lib/hooks/useCurrentLocation";
import { listApprovedProviders, type GuestSafeProviderWithDistance } from "@/lib/storage/repositories/providers";
import { getRatingSummary } from "@/lib/storage/repositories/reviews";
import { oneOffVisitPricePaise, weeklyPlanPricePaise } from "@/lib/business";
import { findCityByAreaText, getCityBySlug } from "@/lib/cities";
import { setPendingReferral } from "@/lib/storage/session";
import type { ProviderType } from "@/lib/storage/types";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { VerificationChip } from "@/components/verification/VerificationChip";
import { ProviderAvatar } from "@/components/ui/ProviderAvatar";

const TYPE_LABEL: Record<ProviderType, string> = { caregiver: "caregiver", babysitter: "babysitter" };

// Public, guest-accessible (Section 5.2) — no login wall before a first-time
// visitor sees real, trustworthy content. listApprovedProviders() already
// strips phone/exact coordinates and filters to approved-only internally.
function SearchResults() {
  const searchParams = useSearchParams();
  const { coords, fetchLocation } = useCurrentLocation();
  const initialType = searchParams.get("type") === "babysitter" ? "babysitter" : "caregiver";
  const [serviceType, setServiceType] = useState<ProviderType>(initialType);
  const [results, setResults] = useState<(GuestSafeProviderWithDistance & { avgRating: number; reviewCount: number })[] | null>(null);
  const [notifyRequested, setNotifyRequested] = useState(false);
  const areaCoords = useRef<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    // Referral capture: a shared `?ref=` link lands here — stash it in
    // session state so it survives the rest of the funnel.
    const ref = searchParams.get("ref");
    if (ref) setPendingReferral(ref);

    // Area scoping: `?city=<slug>` (from the SEO city pages) or `?area=`
    // (from the homepage box) resolves to that city's center — it wins over
    // geolocation because the user asked for that area explicitly.
    const citySlug = searchParams.get("city");
    const city = (citySlug && getCityBySlug(citySlug)) || findCityByAreaText(searchParams.get("area") ?? "");
    if (city) {
      areaCoords.current = city.center;
      return; // geolocation skipped — explicit area wins
    }
    fetchLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    const at = areaCoords.current ?? coords;
    if (!at) return;
    listApprovedProviders({ type: serviceType, latitude: at.latitude, longitude: at.longitude, radiusKm: 15 })
      .then(async (providers) => {
        const withRatings = await Promise.all(
          providers.map(async (p) => {
            const { avg, count } = await getRatingSummary(p.id);
            return { ...p, avgRating: avg, reviewCount: count };
          }),
        );
        setResults(withRatings);
      });
  }, [coords, serviceType, searchParams]);

  const loading = results === null;
  const list = results ?? [];
  const label = TYPE_LABEL[serviceType];

  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col gap-4 px-6 py-8">
      <div className="flex gap-2">
        <TypeChip label="Elder care" active={serviceType === "caregiver"} onClick={() => setServiceType("caregiver")} />
        <TypeChip label="Babysitting" active={serviceType === "babysitter"} onClick={() => setServiceType("babysitter")} />
      </div>

      {!loading && (
        <p className="text-sm text-text-secondary">
          {list.length} verified {label}
          {list.length === 1 ? "" : "s"} near your area · <span className="font-medium">Recommended</span>
        </p>
      )}

      {loading && <p className="text-sm text-text-secondary">Finding verified {label}s near you…</p>}

      {!loading && list.length === 0 && (
        <EmptyState
          icon={SearchIcon}
          title={`No verified ${label}s within 15km yet.`}
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

      {/* Service-card grammar per brand: image well on Mist, name, green
          rating, price + struck original together, one clear action. */}
      <div className="flex flex-col gap-3">
        {list.map((p) => {
          const price = oneOffVisitPricePaise();
          const weeklyPerVisit = Math.round(weeklyPlanPricePaise() / 3);
          return (
            <Link key={p.id} href={`/providers/${p.id}`}>
              <Card className="flex items-stretch gap-4 p-3 transition-shadow hover:shadow-md">
                <div className="flex w-24 shrink-0 items-center justify-center rounded-md bg-surface-secondary">
                  <ProviderAvatar name={p.name} />
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-between gap-1 py-0.5">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold text-text-primary">{p.name}</p>
                    <VerificationChip status={p.verification_status} />
                  </div>
                  <p className="text-sm leading-sm text-text-secondary">
                    {p.reviewCount > 0 ? (
                      <span className="rating inline-flex items-center gap-1 font-medium text-verified">
                        <Star className="h-3.5 w-3.5 fill-verified" />
                        {p.avgRating.toFixed(1)} ({p.reviewCount} visit{p.reviewCount === 1 ? "" : "s"}) ·{" "}
                      </span>
                    ) : null}
                    {p.distance_km.toFixed(1)} km away
                  </p>
                  <p className="price mt-auto text-sm leading-sm">
                    <span className="font-semibold text-text-primary">₹{(weeklyPerVisit / 100).toFixed(0)}</span>
                    <span className="ml-1.5 text-text-secondary line-through">₹{(price / 100).toFixed(0)}</span>
                    <span className="ml-1 text-text-secondary">/visit on a weekly plan</span>
                  </p>
                </div>
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
      className={`min-h-tap flex-1 rounded-full px-4 text-sm font-semibold transition-colors ${active ? "bg-accent-tint text-accent-text" : "bg-surface-secondary text-text-secondary"}`}
    >
      {label}
    </button>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchResults />
    </Suspense>
  );
}

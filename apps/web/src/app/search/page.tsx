"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Bell, MapPin, Search as SearchIcon, ShieldCheck, Star } from "lucide-react";
import { useCurrentLocation } from "@/lib/hooks/useCurrentLocation";
import { listApprovedProviders, type GuestSafeProviderWithDistance } from "@/lib/storage/repositories/providers";
import { getRatingSummary } from "@/lib/storage/repositories/reviews";
import { oneOffVisitPricePaise, weeklyPlanPricePaise } from "@/lib/business";
import { findCityByAreaText, getCityBySlug } from "@/lib/cities";
import { setPendingReferral } from "@/lib/storage/session";
import type { ProviderType } from "@/lib/storage/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { VerificationChip } from "@/components/verification/VerificationChip";
import { ProviderAvatar } from "@/components/ui/ProviderAvatar";

const TYPE_LABEL: Record<ProviderType, string> = { caregiver: "caregiver", babysitter: "babysitter" };
const CARE_IMAGES = ["elder-care-checkin", "caregiver-arrival", "hero-family-care"];

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
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("distance");
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
  const list = (results ?? []).filter((provider) =>
    `${provider.name} ${provider.bio ?? ""}`.toLowerCase().includes(query.trim().toLowerCase()),
  ).sort((a, b) => sort === "rating" ? b.avgRating - a.avgRating || a.distance_km - b.distance_km : a.distance_km - b.distance_km);
  const label = TYPE_LABEL[serviceType];

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8 sm:py-10">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold leading-3xl text-text-primary sm:text-4xl sm:leading-4xl">Find the right care, close to home.</h1>
          <p className="mt-3 text-base leading-base text-text-secondary">Compare verified profiles, visit ratings and clear prices. Choose someone who fits your family.</p>
        </div>
        <Link href="/how-it-works" className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-accent-text"><ShieldCheck className="h-5 w-5" /> How we verify providers</Link>
      </div>

      <div className="flex flex-col gap-4 rounded-lg bg-surface-secondary p-4 lg:flex-row lg:items-center">
      <div className="flex gap-2 lg:w-80 lg:shrink-0">
        <TypeChip label="Elder care" active={serviceType === "caregiver"} onClick={() => setServiceType("caregiver")} />
        <TypeChip label="Babysitting" active={serviceType === "babysitter"} onClick={() => setServiceType("babysitter")} />
      </div>
        <label className="flex min-h-tap min-w-0 flex-1 items-center gap-2 rounded-md border border-border bg-surface px-3"><SearchIcon className="h-4 w-4 shrink-0 text-text-secondary" /><span className="sr-only">Search providers by name or care needs</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or care needs" className="min-w-0 flex-1 bg-transparent py-2 text-base text-text-primary placeholder:text-text-secondary" /></label>
        <label className="flex items-center gap-2 text-sm text-text-secondary">Sort by<select value={sort} onChange={(event) => setSort(event.target.value)} className="min-h-tap flex-1 rounded-md border border-border bg-surface px-3 text-sm text-text-primary lg:flex-none"><option value="distance">Nearest first</option><option value="rating">Highest rated</option></select></label>
      </div>

      {!loading && (
        <p className="text-sm text-text-secondary">
          {list.length} verified {label}
          {list.length === 1 ? "" : "s"} near your area · <span className="font-medium">Within 15 km</span>
        </p>
      )}

      {loading && <div role="status"><p className="mb-4 text-sm text-text-secondary">Finding verified {label}s near you…</p><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="overflow-hidden rounded-lg border border-border"><div className="aspect-[16/10] bg-surface-secondary" /><div className="flex flex-col gap-3 p-5"><div className="h-5 w-2/3 rounded-sm bg-surface-secondary" /><div className="h-4 rounded-sm bg-surface-secondary" /><div className="h-10 rounded-md bg-surface-secondary" /></div></div>)}</div></div>}

      {!loading && list.length === 0 && (
        <EmptyState
          icon={SearchIcon}
          title={query.trim() ? "No profiles match your search." : `No verified ${label}s within 15km yet.`}
          body={query.trim() ? "Try another name or care need, or clear your search to see all nearby providers." : "CareKin is live in a few neighborhoods so far. Check another service or browse our launch area."}
          action={
            query.trim() ? <button onClick={() => setQuery("")} className="min-h-tap rounded-md bg-accent px-5 text-sm font-semibold text-white">Clear search</button> :
            <button
              onClick={() => setNotifyRequested(true)}
              disabled={notifyRequested}
              className="min-h-tap mt-2 flex items-center gap-2 rounded-md bg-accent px-5 text-sm font-semibold text-white"
            >
              <Bell className="h-4 w-4" /> {notifyRequested ? "We'll notify you" : "Notify me"}
            </button>
          }
        />
      )}

      {/* Service-card grammar per brand: image well on Mist, name, green
          rating, price + struck original together, one clear action. */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((p) => {
          const price = oneOffVisitPricePaise();
          const weeklyPerVisit = Math.round(weeklyPlanPricePaise() / 3);
          const scene = p.type === "babysitter" ? "babysitting-storytime" : CARE_IMAGES[Array.from(p.id).reduce((sum, letter) => sum + letter.charCodeAt(0), 0) % CARE_IMAGES.length];
          return (
            <Link key={p.id} href={`/providers/${p.id}`} className="group flex min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-surface transition-colors hover:border-accent" aria-label={`View ${p.name}'s ${label} profile`}>
                <div className="relative aspect-[16/10] overflow-hidden bg-surface-secondary">
                  <Image src={`/images/carekin/${scene}.webp`} alt={p.type === "babysitter" ? "Illustrative childcare scene: reading together at home" : "Illustrative elder care scene: everyday support at home"} fill sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw" className={`object-cover ${scene === "caregiver-arrival" ? "object-top" : "object-center"}`} />
                  <span className="absolute left-3 top-3 rounded-full bg-surface px-3 py-1 text-xs font-semibold text-text-primary">{p.type === "caregiver" ? "Elder care" : "Babysitting"}</span>
                  <span className="absolute bottom-3 right-3 rounded-md bg-ink px-2 py-1 text-xs text-white">Illustrative care scene</span>
                </div>
                <div className="flex flex-1 flex-col gap-4 p-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <ProviderAvatar name={p.name} />
                    <div className="min-w-0"><h2 className="break-words font-body-latin text-lg font-semibold text-text-primary">{p.name}</h2>
                    <VerificationChip status={p.verification_status} />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm leading-sm text-text-secondary">
                    {p.reviewCount > 0 ? (
                      <span className="rating inline-flex items-center gap-1 font-medium text-verified">
                        <Star className="h-3.5 w-3.5 fill-verified" />
                        {p.avgRating.toFixed(1)} ({p.reviewCount} visit{p.reviewCount === 1 ? "" : "s"})
                      </span>
                    ) : <span>No visit reviews yet</span>}
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{p.distance_km.toFixed(1)} km away</span>
                  </div>
                  <p className="line-clamp-2 text-sm leading-sm text-text-secondary">{p.bio || "View this provider’s profile to explore care options and booking details."}</p>
                  <div className="mt-auto border-t border-border pt-4"><div className="flex flex-wrap items-baseline gap-x-2"><span className="price text-xl font-semibold text-text-primary">₹{(weeklyPerVisit / 100).toFixed(0)}</span><span className="text-sm text-text-secondary">/ visit on a weekly plan</span></div><p className="mt-1 text-sm text-text-secondary">One-off visit <span className="price">₹{(price / 100).toFixed(0)}</span></p><span className="mt-4 flex min-h-tap items-center justify-between rounded-md bg-accent-tint px-4 text-sm font-semibold text-accent-text transition-colors group-hover:bg-accent group-hover:text-white">View profile <ArrowRight className="h-4 w-4" /></span></div>
                </div>
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
      aria-pressed={active}
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

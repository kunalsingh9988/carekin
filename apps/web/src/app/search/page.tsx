"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { ArrowRight, MapPin, Search as SearchIcon, ShieldCheck, Star } from "lucide-react";
import { ALL_LOCATIONS_RADIUS_KM } from "@/lib/locations";
import { listApprovedProviders, type GuestSafeProviderWithDistance } from "@/lib/storage/repositories/providers";
import { getRatingSummary } from "@/lib/storage/repositories/reviews";
import { oneOffVisitPricePaise, weeklyPlanPricePaise } from "@/lib/business";
import { findCityByAreaText, getCityBySlug } from "@/lib/cities";
import { setPendingReferral } from "@/lib/storage/session";
import type { ProviderType } from "@/lib/storage/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { VerificationChip } from "@/components/verification/VerificationChip";
import { ProviderAvatar } from "@/components/ui/ProviderAvatar";
import { DevelopmentProviderGallery } from "@/components/providers/DevelopmentProviderGallery";

const TYPE_LABEL: Record<ProviderType, string> = { caregiver: "caregiver", babysitter: "babysitter" };
const CARE_IMAGES = ["elder-care-checkin", "caregiver-arrival", "hero-family-care", "caregiver-walk"];
const CHILDCARE_IMAGES = ["babysitting-storytime", "babysitting-playtime"];

// Public, guest-accessible (Section 5.2) — no login wall before a first-time
// visitor sees real, trustworthy content. listApprovedProviders() already
// strips phone/exact coordinates and filters to approved-only internally.
function SearchResults() {
  const searchParams = useSearchParams();
  const initialType = searchParams.get("type") === "babysitter" ? "babysitter" : "caregiver";
  const [serviceType, setServiceType] = useState<ProviderType>(initialType);
  const [results, setResults] = useState<(GuestSafeProviderWithDistance & { avgRating: number; reviewCount: number })[] | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("distance");
  const citySlug = searchParams.get("city");
  const area = searchParams.get("area")?.trim() || (citySlug ? getCityBySlug(citySlug)?.name ?? citySlug.replaceAll("-", " ") : "");
  const city = (citySlug && getCityBySlug(citySlug)) || findCityByAreaText(area);
  const latitude = city ? city.center.latitude : 0;
  const longitude = city ? city.center.longitude : 0;

  useEffect(() => {
    // Referral capture: a shared `?ref=` link lands here — stash it in
    // session state so it survives the rest of the funnel.
    const ref = searchParams.get("ref");
    if (ref) setPendingReferral(ref);

  }, [searchParams]);

  useEffect(() => {
    let active = true;
    listApprovedProviders({ type: serviceType, latitude, longitude, radiusKm: ALL_LOCATIONS_RADIUS_KM })
      .then(async (providers) => {
        const withRatings = await Promise.all(
          providers.map(async (p) => {
            const { avg, count } = await getRatingSummary(p.id);
            return { ...p, avgRating: avg, reviewCount: count };
          }),
        );
        if (active) { setResults(withRatings); setError(""); }
      }).catch(() => { if (active) { setError("We couldn’t load providers. Please try again."); setResults([]); } });
    return () => { active = false; };
  }, [latitude, longitude, serviceType, retry]);

  const loading = results === null;
  const list = (results ?? []).filter((provider) =>
    `${provider.name} ${provider.bio ?? ""}`.toLowerCase().includes(query.trim().toLowerCase()),
  ).sort((a, b) => sort === "rating" ? b.avgRating - a.avgRating || a.name.localeCompare(b.name) : city ? a.distance_km - b.distance_km : a.name.localeCompare(b.name));
  const label = TYPE_LABEL[serviceType];

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8 sm:py-10">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold leading-3xl text-text-primary sm:text-4xl sm:leading-4xl">Find the right care, close to home.</h1>
          <p className="mt-3 text-base leading-base text-text-secondary">Compare verified profiles, visit ratings and clear prices. Choose someone who fits your family.</p>
          <p className="mt-3 break-words text-sm text-accent-text">All locations are open for development testing{area ? ` · Searching from ${area}` : ""}. Approved profiles are shown across all locations.</p>
        </div>
        <Link href="/how-it-works" className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-accent-text"><ShieldCheck className="h-5 w-5" /> How we verify providers</Link>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
      <div className="flex gap-2 lg:w-80 lg:shrink-0">
        <TypeChip label="Elder care" active={serviceType === "caregiver"} onClick={() => setServiceType("caregiver")} />
        <TypeChip label="Babysitting" active={serviceType === "babysitter"} onClick={() => setServiceType("babysitter")} />
      </div>
        <label className="flex min-h-tap min-w-0 flex-1 items-center gap-2 rounded-md border border-border bg-surface px-3"><SearchIcon className="h-4 w-4 shrink-0 text-text-secondary" /><span className="sr-only">Search providers by name or care needs</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or care needs" className="min-w-0 flex-1 bg-transparent py-2 text-base text-text-primary placeholder:text-text-secondary" /></label>
        <label className="flex items-center gap-2 text-sm text-text-secondary">Sort by<select value={sort} onChange={(event) => setSort(event.target.value)} className="min-h-tap flex-1 rounded-md border border-border bg-surface px-3 text-sm text-text-primary lg:flex-none"><option value="distance">{city ? "Nearest to city centre" : "Name A–Z"}</option><option value="rating">Highest rated</option></select></label>
      </div>

      <DevelopmentProviderGallery type={serviceType} query={query} />

      {!loading && (
        <p className="text-sm text-text-secondary">
          {list.length} verified {label}
          {list.length === 1 ? "" : "s"} · <span className="font-medium">All locations</span>
        </p>
      )}

      {loading && <p role="status" className="text-sm text-text-secondary">Loading approved profiles across all locations…</p>}
      {error && <p role="alert" className="text-sm text-danger">{error} <button onClick={() => setRetry(value => value + 1)} className="min-h-tap px-3 underline">Retry</button></p>}

      {!loading && !error && list.length === 0 && (
        <EmptyState
          icon={SearchIcon}
          title={query.trim() ? "No profiles match your search." : `No approved ${label} profiles yet.`}
          body={query.trim() ? "Try another name or care need, or clear your search to see all approved providers." : "All locations are enabled for testing. Providers appear here after their applications are approved."}
          action={
            query.trim() ? <button onClick={() => setQuery("")} className="min-h-tap rounded-md bg-accent px-5 text-sm font-semibold text-white">Clear search</button> :
            <Link href="/provider/apply" className="inline-flex min-h-tap items-center rounded-md bg-accent px-5 text-sm font-semibold text-white">Apply to provide care</Link>
          }
        />
      )}

      {/* Service-card grammar per brand: image well on Mist, name, green
          rating, price + struck original together, one clear action. */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((p) => {
          const price = oneOffVisitPricePaise();
          const weeklyPerVisit = Math.round(weeklyPlanPricePaise() / 3);
          const scenes = p.type === "babysitter" ? CHILDCARE_IMAGES : CARE_IMAGES;
          const sceneIndex = Number(p.id.match(/\d+$/)?.[0] ?? Array.from(p.id).reduce((sum, letter) => sum + letter.charCodeAt(0), 0));
          const scene = scenes[sceneIndex % scenes.length];
          return (
            <Link key={p.id} href={`/providers/${p.id}`} className="group flex min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-surface transition-colors hover:border-accent" aria-label={`View ${p.name}'s ${label} profile`}>
                <div className="relative aspect-[16/10] overflow-hidden bg-surface-secondary">
                  <Image src={`/images/carekin/brand-v2/${scene}.webp`} alt={p.type === "babysitter" ? "Illustrative babysitter in a CareKin T-shirt caring for a child" : "Illustrative caregiver in a CareKin T-shirt supporting an elder"} fill sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw" className={`object-cover ${scene === "caregiver-arrival" ? "object-top" : "object-center"}`} />
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
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{city ? `${p.distance_km.toFixed(1)} km from city centre` : "Available for development testing"}</span>
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

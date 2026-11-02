"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { get } from "@/lib/storage/client";
import { CITIES } from "@/lib/cities";
import { oneOffVisitPricePaise, weeklyPlanPricePaise, WEEKLY_DISCOUNT_PCT } from "@/lib/business";
import type { Provider, Review } from "@/lib/storage/types";

// Homepage is a Persuade surface (Section 5.1). Brand: Ink hero carrying
// the whole emotional claim, numbers doing the persuading, Mist bands for
// the how-it-works and category sections, exactly one violet action per
// viewport.
export default function Home() {
  const router = useRouter();
  const [location, setLocation] = useState("");
  const [stats, setStats] = useState<{ providers: number; avgRating: number | null; reviews: number } | null>(null);

  useEffect(() => {
    // Live proof numbers — read straight from seeded stores (approved only,
    // same rule as /search). Numbers are the persuasion device per brand.
    queueMicrotask(() => {
      const providers = get<Provider[]>("providers", []).filter((p) => p.verification_status === "approved");
      const reviews = get<Review[]>("reviews", []);
      const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;
      setStats({ providers: providers.length, avgRating: avg, reviews: reviews.length });
    });
  }, []);

  const liveNeighborhoods = CITIES.filter((c) => c.live).map((c) => c.neighborhoods).join(", ");
  const visitPrice = oneOffVisitPricePaise();
  const weeklyPerVisit = Math.round(weeklyPlanPricePaise() / 3);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const area = location.trim();
    router.push(area ? `/search?area=${encodeURIComponent(area)}` : "/search");
  }

  return (
    <main className="flex flex-1 flex-col">
      {/* Ink hero — brand allows Ink as a hero surface. Display face at
          56px/800 per the type scale; single violet action = Search. */}
      <section className="bg-ink px-6 py-16 text-center sm:py-20">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-6">
          <h1 className="font-display-latin text-4xl font-extrabold leading-4xl text-white sm:text-5xl sm:leading-5xl">
            Home care you can actually trust.
          </h1>
          <p className="max-w-md text-base leading-base text-white/70">
            Verified elder caregivers and babysitters, booked in a few taps.
            Every provider passes ID checks, a police verification, and an
            in-person interview — before you ever see their profile.
          </p>

          <form onSubmit={handleSearch} className="flex w-full max-w-md flex-col gap-2 sm:flex-row">
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter your area"
              aria-label="Your area"
              className="min-h-tap min-w-0 flex-1 rounded-md bg-white px-4 text-base text-text-primary placeholder:text-text-secondary"
            />
            <button
              type="submit"
              className="min-h-tap rounded-md bg-accent px-6 text-base font-semibold text-white transition-colors hover:bg-accent-text"
            >
              Search now
            </button>
          </form>

          {/* Proof strip — numbers do the persuading, green only beside a
              rating claim. */}
          <p className="text-sm leading-sm text-white/60">
            {stats ? `${stats.providers} verified providers` : "Verified providers"}
            {stats?.avgRating ? (
              <>
                {" · "}
                <span className="rating text-verified">★ {stats.avgRating.toFixed(1)}</span> across {stats.reviews} visits
              </>
            ) : null}
            {" · "}4-step background check on every profile
          </p>
        </div>
      </section>

      {/* Service categories — "Most booked services" card pattern:
          service-first nouns, price + rating visible together. */}
      <section className="bg-surface-secondary px-6 py-12">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          <h2 className="text-3xl font-bold leading-3xl text-text-primary">Book care near you</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Link
              href="/search?type=caregiver"
              className="group flex flex-col gap-3 rounded-lg border border-border bg-surface p-5 transition-shadow hover:shadow-md"
            >
              <p className="text-lg font-semibold leading-lg text-text-primary">Elder care</p>
              <p className="text-sm leading-sm text-text-secondary">
                Company, meals, walks, medication reminders — for a parent who shouldn&apos;t be alone.
              </p>
              <p className="mt-auto text-sm leading-sm">
                <span className="price font-semibold text-text-primary">₹{(weeklyPerVisit / 100).toFixed(0)}</span>
                <span className="price ml-1.5 text-text-secondary line-through">₹{(visitPrice / 100).toFixed(0)}</span>
                <span className="ml-1 text-text-secondary">/visit on a weekly plan · {WEEKLY_DISCOUNT_PCT}% less</span>
              </p>
              <p className="flex items-center gap-1 text-sm font-semibold text-accent-text">
                Find elder care <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </p>
            </Link>
            <Link
              href="/search?type=babysitter"
              className="group flex flex-col gap-3 rounded-lg border border-border bg-surface p-5 transition-shadow hover:shadow-md"
            >
              <p className="text-lg font-semibold leading-lg text-text-primary">Babysitting</p>
              <p className="text-sm leading-sm text-text-secondary">
                Evenings, workdays, or a regular weekly plan — sitters verified for your kids.
              </p>
              <p className="mt-auto text-sm leading-sm">
                <span className="price font-semibold text-text-primary">₹{(weeklyPerVisit / 100).toFixed(0)}</span>
                <span className="price ml-1.5 text-text-secondary line-through">₹{(visitPrice / 100).toFixed(0)}</span>
                <span className="ml-1 text-text-secondary">/visit on a weekly plan · {WEEKLY_DISCOUNT_PCT}% less</span>
              </p>
              <p className="flex items-center gap-1 text-sm font-semibold text-accent-text">
                Find a babysitter <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* How it works — three plain steps, no cards-in-cards. */}
      <section className="px-6 py-12">
        <div className="mx-auto flex max-w-3xl flex-col gap-8">
          <h2 className="text-3xl font-bold leading-3xl text-text-primary">How CareKin works</h2>
          <ol className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <li className="flex flex-col gap-2">
              <ShieldCheck className="h-6 w-6 text-verified" />
              <p className="text-base font-semibold leading-base text-text-primary">Search verified profiles</p>
              <p className="text-sm leading-sm text-text-secondary">
                Every caregiver is ID-checked, police-verified, and interviewed before they appear.
              </p>
            </li>
            <li className="flex flex-col gap-2">
              <ShieldCheck className="h-6 w-6 text-verified" />
              <p className="text-base font-semibold leading-base text-text-primary">Book a visit or weekly plan</p>
              <p className="text-sm leading-sm text-text-secondary">
                One-off visits from ₹{(visitPrice / 100).toFixed(0)}, or save {WEEKLY_DISCOUNT_PCT}% on a weekly plan.
              </p>
            </li>
            <li className="flex flex-col gap-2">
              <ShieldCheck className="h-6 w-6 text-verified" />
              <p className="text-base font-semibold leading-base text-text-primary">Message and pay in-app</p>
              <p className="text-sm leading-sm text-text-secondary">
                Chat unlocks when the booking confirms. Receipts, reviews, and rebooking in one place.
              </p>
            </li>
          </ol>
          <Link href="/how-it-works" className="text-sm font-semibold text-accent-text">
            See exactly how verification works →
          </Link>
        </div>
      </section>

      {/* Cities strip — chips, 99px radius. */}
      <section className="bg-surface-secondary px-6 py-12">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          <h2 className="text-3xl font-bold leading-3xl text-text-primary">Where we&apos;re live</h2>
          <div className="flex flex-wrap gap-2">
            {CITIES.map((city) => (
              <Link
                key={city.slug}
                href={`/cities/${city.slug}`}
                className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:border-accent"
              >
                {city.name}
                {city.live ? "" : " · soon"}
              </Link>
            ))}
          </div>
          <p className="text-sm leading-sm text-text-secondary">Live in {liveNeighborhoods} — more neighborhoods coming soon.</p>
        </div>
      </section>

      <section className="px-6 py-16 text-center">
        <div className="mx-auto flex max-w-md flex-col items-center gap-4">
          <h2 className="text-3xl font-bold leading-3xl text-text-primary">Ready to find someone you trust?</h2>
          <Link
            href="/search"
            className="min-h-tap flex items-center rounded-md bg-accent px-6 text-base font-semibold text-white transition-colors hover:bg-accent-text"
          >
            Search verified providers
          </Link>
        </div>
      </section>
    </main>
  );
}

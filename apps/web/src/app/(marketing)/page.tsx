"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BadgeCheck, CalendarDays, CircleCheck, HeartHandshake, MapPin, MessageCircle, Search, ShieldCheck, Sparkles } from "lucide-react";
import { get } from "@/lib/storage/client";
import { CITIES } from "@/lib/cities";
import { oneOffVisitPricePaise, weeklyPlanPricePaise, WEEKLY_DISCOUNT_PCT } from "@/lib/business";
import type { Provider, Review } from "@/lib/storage/types";

const serviceCards = [
  { title: "Elder care", body: "Company, walks, meals and medication reminders for a parent who should not have to be alone.", href: "/search?type=caregiver", action: "Find elder care", image: "/images/carekin/elder-care-checkin.webp", alt: "A caregiver supporting an older man with his daily routine" },
  { title: "Babysitting", body: "Thoughtful, verified sitters for workdays, evenings and the everyday moments that need another pair of hands.", href: "/search?type=babysitter", action: "Find a babysitter", image: "/images/carekin/babysitting-storytime.webp", alt: "A babysitter reading with a young child" },
];

const trustSteps = [
  { icon: BadgeCheck, title: "Identity checked", body: "We verify every provider before they can accept a booking." },
  { icon: ShieldCheck, title: "Background reviewed", body: "Only providers who complete the review can appear in your search." },
  { icon: HeartHandshake, title: "A better fit", body: "Browse care type, price and verified visit ratings before you decide." },
];

export default function Home() {
  const router = useRouter();
  const [location, setLocation] = useState("");
  const [stats, setStats] = useState<{ providers: number; avgRating: number | null; reviews: number } | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      const providers = get<Provider[]>("providers", []).filter((provider) => provider.verification_status === "approved");
      const reviews = get<Review[]>("reviews", []);
      const avgRating = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : null;
      setStats({ providers: providers.length, avgRating, reviews: reviews.length });
    });
  }, []);

  const visitPrice = oneOffVisitPricePaise();
  const weeklyPerVisit = Math.round(weeklyPlanPricePaise() / 3);
  const liveCities = CITIES.filter((city) => city.live);

  function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    const area = location.trim();
    router.push(area ? `/search?area=${encodeURIComponent(area)}` : "/search");
  }

  return (
    <main className="flex flex-1 flex-col overflow-hidden">
      <section className="bg-ink px-6 pb-10 pt-8 text-white sm:pb-16 sm:pt-14">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:gap-14">
          <div className="relative z-10 flex flex-col items-start gap-6 py-4">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-medium text-white/80"><Sparkles className="h-4 w-4 text-white" /> Care, made easier to trust</p>
            <h1 className="max-w-xl font-display-latin text-4xl font-extrabold leading-4xl tracking-[-0.03em] sm:text-5xl sm:leading-5xl">More good days at home, for everyone who cares.</h1>
            <p className="max-w-lg text-base leading-base text-white/72 sm:text-lg sm:leading-lg">Find verified elder caregivers and babysitters who bring dependable support into the rhythm of your family&apos;s day.</p>
            <form onSubmit={handleSearch} className="w-full max-w-xl rounded-xl bg-white p-2 shadow-2xl shadow-black/20">
              <label htmlFor="area" className="sr-only">Your area</label>
              <div className="flex flex-col gap-2 sm:flex-row"><div className="flex min-h-tap flex-1 items-center gap-2 px-3"><MapPin className="h-5 w-5 shrink-0 text-accent" /><input id="area" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Enter your area or city" className="min-w-0 flex-1 bg-transparent text-base text-text-primary outline-none placeholder:text-text-secondary" /></div><button type="submit" className="min-h-tap rounded-lg bg-accent px-5 text-sm font-semibold text-white transition-colors hover:bg-accent-text">Find care near me</button></div>
            </form>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/65"><span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-white" /> 4-step provider review</span><span className="inline-flex items-center gap-1.5"><CircleCheck className="h-4 w-4 text-white" /> See price before booking</span></div>
          </div>
          <div className="relative min-h-[360px] overflow-hidden rounded-2xl sm:min-h-[480px]"><Image src="/images/carekin/hero-family-care.webp" alt="A family and caregiver helping an older woman at home" fill priority sizes="(max-width: 1024px) 100vw, 58vw" className="object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" /><div className="absolute bottom-5 left-5 right-5 flex flex-wrap gap-3 sm:bottom-6 sm:left-6"><div className="rounded-xl bg-white/95 px-4 py-3 text-text-primary shadow-lg backdrop-blur-sm"><p className="text-xs font-medium text-text-secondary">Available in your neighbourhood</p><p className="mt-0.5 text-sm font-semibold">Care that fits your family&apos;s routine</p></div></div></div>
        </div>
      </section>

      <section className="border-b border-border bg-surface px-6 py-6"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-3 text-center"><p className="text-sm font-medium text-text-primary">Verified profiles only</p><span className="hidden h-4 w-px bg-border sm:block" /><p className="text-sm font-medium text-text-primary">Booking details before you pay</p><span className="hidden h-4 w-px bg-border sm:block" /><p className="text-sm font-medium text-text-primary">Support when plans change</p>{stats && <><span className="hidden h-4 w-px bg-border sm:block" /><p className="text-sm text-text-secondary"><span className="font-semibold text-text-primary">{stats.providers}</span> verified providers in this demo</p></>}</div></section>

      <section className="px-6 py-16 sm:py-24"><div className="mx-auto max-w-6xl"><div className="flex max-w-2xl flex-col gap-3"><h2 className="text-3xl font-bold leading-3xl tracking-[-0.02em] text-text-primary sm:text-4xl sm:leading-4xl">Care for the people you love, without the guesswork.</h2><p className="text-base leading-base text-text-secondary">Choose the kind of help you need today. You can see who is available and what a visit costs before you create an account.</p></div><div className="mt-9 grid gap-6 md:grid-cols-2">{serviceCards.map((service) => <Link key={service.title} href={service.href} className="group grid overflow-hidden rounded-2xl bg-surface-secondary transition-shadow hover:shadow-lg sm:grid-cols-[0.92fr_1.08fr]"><div className="relative min-h-72"><Image src={service.image} alt={service.alt} fill sizes="(max-width: 768px) 100vw, 46vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" /></div><div className="flex flex-col items-start p-7 sm:p-8"><h3 className="text-2xl font-bold leading-2xl text-text-primary">{service.title}</h3><p className="mt-3 text-sm leading-sm text-text-secondary">{service.body}</p><p className="price mt-6 text-sm"><span className="font-semibold text-text-primary">₹{(weeklyPerVisit / 100).toFixed(0)}/visit</span><span className="ml-2 text-text-secondary line-through">₹{(visitPrice / 100).toFixed(0)}</span><span className="ml-1 text-text-secondary">on a weekly plan</span></p><span className="mt-auto inline-flex items-center gap-2 pt-7 text-sm font-semibold text-accent-text">{service.action} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span></div></Link>)}</div></div></section>

      <section className="bg-surface-secondary px-6 py-16 sm:py-24"><div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16"><div className="relative min-h-[340px] overflow-hidden rounded-2xl sm:min-h-[440px]"><Image src="/images/carekin/elder-care-checkin.webp" alt="A caregiver helping an older man organise his daily routine" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" /></div><div><h2 className="max-w-xl text-3xl font-bold leading-3xl tracking-[-0.02em] text-text-primary sm:text-4xl sm:leading-4xl">Trust is built before the first visit.</h2><p className="mt-4 max-w-xl text-base leading-base text-text-secondary">CareKin keeps the important details close: who is coming, why they&apos;re verified, what care they offer and what you&apos;ll pay.</p><div className="mt-8 flex flex-col divide-y divide-border">{trustSteps.map(({ icon: Icon, title, body }) => <div key={title} className="flex gap-4 py-5 first:pt-0"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-tint text-accent-text"><Icon className="h-5 w-5" /></div><div><h3 className="font-semibold text-text-primary">{title}</h3><p className="mt-1 text-sm leading-sm text-text-secondary">{body}</p></div></div>)}</div><Link href="/how-it-works" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-accent-text">See how verification works <ArrowRight className="h-4 w-4" /></Link></div></div></section>

      <section className="px-6 py-16 sm:py-24"><div className="mx-auto max-w-6xl"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div className="max-w-xl"><h2 className="text-3xl font-bold leading-3xl tracking-[-0.02em] text-text-primary sm:text-4xl sm:leading-4xl">Simple from search to settled-in.</h2><p className="mt-3 text-base leading-base text-text-secondary">A clear path keeps the focus on your family—not a complicated booking process.</p></div><Link href="/search" className="inline-flex items-center gap-2 text-sm font-semibold text-accent-text">Browse verified providers <ArrowRight className="h-4 w-4" /></Link></div><div className="mt-10 grid gap-7 md:grid-cols-3"><ProcessStep icon={Search} title="Search your area" body="Choose elder care or babysitting and view only approved profiles nearby." /><ProcessStep icon={CalendarDays} title="Pick a visit" body="Choose a one-off visit or a weekly plan that fits the help you need." /><ProcessStep icon={MessageCircle} title="Stay in the loop" body="Once confirmed, keep booking details, messages and rebooking in one place." /></div></div></section>

      <section className="bg-ink px-6 py-16 text-white sm:py-24"><div className="mx-auto grid max-w-6xl gap-10 overflow-hidden rounded-2xl bg-ink lg:grid-cols-[0.85fr_1.15fr] lg:items-center"><div className="relative order-2 min-h-[360px] lg:order-1 lg:min-h-[460px]"><Image src="/images/carekin/caregiver-arrival.webp" alt="A caregiver arriving at an older woman’s home" fill sizes="(max-width: 1024px) 100vw, 48vw" className="object-cover" /></div><div className="order-1 p-7 sm:p-12 lg:order-2 lg:pr-16"><h2 className="text-3xl font-bold leading-3xl tracking-[-0.02em] sm:text-4xl sm:leading-4xl">The right support can change how a whole week feels.</h2><p className="mt-5 max-w-lg text-base leading-base text-white/70">Start with one visit, or make space for regular help with a plan that is easier to manage and less expensive per visit.</p><div className="mt-8 flex flex-wrap gap-3"><Link href="/search" className="min-h-tap inline-flex items-center rounded-lg bg-accent px-5 text-sm font-semibold text-white transition-colors hover:bg-accent-text">Find care near me</Link><Link href="/pricing" className="min-h-tap inline-flex items-center rounded-lg border border-white/25 px-5 text-sm font-semibold text-white transition-colors hover:bg-white/10">See simple pricing</Link></div><p className="mt-6 text-sm text-white/60">Weekly plans save {WEEKLY_DISCOUNT_PCT}% compared with booking visits one at a time.</p></div></div></section>

      <section className="px-6 py-16 sm:py-24"><div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_1fr] lg:items-center"><div><h2 className="text-3xl font-bold leading-3xl tracking-[-0.02em] text-text-primary sm:text-4xl sm:leading-4xl">For the moments you wish you could be there.</h2><p className="mt-4 max-w-lg text-base leading-base text-text-secondary">The person arranging care is often balancing work, distance and worry. CareKin is designed to make the next step feel clear, human and close to home.</p><Link href="/provider/apply" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-accent-text">Are you a care professional? Apply to join <ArrowRight className="h-4 w-4" /></Link></div><div className="relative min-h-[340px] overflow-hidden rounded-2xl sm:min-h-[420px]"><Image src="/images/carekin/family-peace.webp" alt="An adult son and his father enjoying tea together" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" /></div></div></section>

      <section className="bg-surface-secondary px-6 py-16 sm:py-20"><div className="mx-auto max-w-6xl"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h2 className="text-3xl font-bold leading-3xl tracking-[-0.02em] text-text-primary">Care, starting close to home.</h2><p className="mt-2 text-base text-text-secondary">We&apos;re growing neighborhood by neighborhood, so availability stays meaningful.</p></div><Link href="/cities" className="inline-flex items-center gap-2 text-sm font-semibold text-accent-text">Explore all cities <ArrowRight className="h-4 w-4" /></Link></div><div className="mt-8 grid gap-3 sm:grid-cols-3">{liveCities.map((city) => <Link key={city.slug} href={`/cities/${city.slug}`} className="group rounded-xl bg-surface p-5 transition-shadow hover:shadow-md"><div className="flex items-center justify-between"><MapPin className="h-5 w-5 text-accent" /><span className="text-xs font-semibold text-verified">Live now</span></div><p className="mt-6 text-lg font-semibold text-text-primary">{city.name}</p><p className="mt-1 text-sm text-text-secondary">{city.neighborhoods}</p><span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-accent-text">View availability <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span></Link>)}</div></div></section>

      <section className="px-6 py-20 text-center sm:py-28"><div className="mx-auto flex max-w-2xl flex-col items-center"><h2 className="text-3xl font-bold leading-3xl tracking-[-0.02em] text-text-primary sm:text-4xl sm:leading-4xl">A little more support can make a big difference.</h2><p className="mt-4 text-base leading-base text-text-secondary">Start by seeing who&apos;s verified near you. There&apos;s no account needed to browse.</p><Link href="/search" className="mt-8 inline-flex min-h-tap items-center gap-2 rounded-lg bg-accent px-6 text-base font-semibold text-white transition-colors hover:bg-accent-text">Search verified providers <ArrowRight className="h-4 w-4" /></Link></div></section>
    </main>
  );
}

function ProcessStep({ icon: Icon, title, body }: { icon: typeof Search; title: string; body: string }) {
  return <div className="flex flex-col gap-4"><div className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-secondary text-accent"><Icon className="h-5 w-5" /></div><div><h3 className="text-lg font-semibold text-text-primary">{title}</h3><p className="mt-2 text-sm leading-sm text-text-secondary">{body}</p></div></div>;
}

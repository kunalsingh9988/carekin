import Image from "next/image";
import Link from "next/link";
import { oneOffVisitPricePaise, weeklyPlanPricePaise, WEEKLY_DISCOUNT_PCT, VISITS_PER_WEEK } from "@/lib/business";
import { Card } from "@/components/ui/Card";

const FAQ = [
  { q: "Is the commission included in the price I see?", a: "Yes. The price shown is the full price — nothing is added at checkout." },
  { q: "Can I switch from one-off to a weekly plan later?", a: "Yes, anytime from your booking, with one tap." },
  { q: "What if I need to cancel?", a: "Free cancellation up to 4 hours before a scheduled visit." },
];

export default function PricingPage() {
  const oneOff = oneOffVisitPricePaise();
  const weekly = weeklyPlanPricePaise();
  const perVisitWeekly = Math.round(weekly / VISITS_PER_WEEK);

  return (
    <main className="flex flex-1 flex-col"><section className="bg-surface-secondary px-6 py-10 sm:py-14"><div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-[1fr_0.85fr] md:items-center"><div><h1 className="text-4xl font-bold leading-4xl tracking-[-0.02em] text-text-primary">Simple pricing. No surprise fees at checkout.</h1><p className="mt-4 text-base leading-base text-text-secondary">
          What you see here is what you pay — our commission is already included, not added later.
        </p></div><div className="relative min-h-56 overflow-hidden rounded-2xl"><Image src="/images/carekin/family-peace.webp" alt="A father and son sharing a peaceful moment together" fill sizes="(max-width: 768px) 100vw, 42vw" className="object-cover" /></div></div></section><div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-16">

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="flex flex-col gap-3">
          <p className="text-lg font-semibold leading-lg text-text-primary">Pay per visit</p>
          <p className="text-sm leading-sm text-text-secondary">Best for occasional or one-time care needs</p>
          <p className="mt-2 text-3xl font-bold leading-3xl text-text-primary">
            <span className="price">₹{(oneOff / 100).toFixed(0)}</span>
            <span className="text-sm font-normal text-text-secondary"> per visit</span>
          </p>
          <Link href="/search" className="min-h-tap mt-2 flex items-center justify-center rounded-md border border-border text-sm font-semibold text-text-primary transition-colors hover:bg-surface-secondary">
            Search one-off availability
          </Link>
        </Card>

        {/* Recommended plan — violet-tint selected state + accent border;
            the only violet action on this view is its CTA. */}
        <Card className="relative flex flex-col gap-3 border-accent">
          <span className="absolute -top-3 left-4 rounded-full bg-accent-tint px-3 py-1 text-xs font-semibold text-accent-text">
            Most families choose this
          </span>
          <p className="text-lg font-semibold leading-lg text-text-primary">Weekly plan</p>
          <p className="text-sm leading-sm text-text-secondary">Best for ongoing elder care or regular babysitting</p>
          <p className="mt-2 text-3xl font-bold leading-3xl text-text-primary">
            <span className="price">₹{(weekly / 100).toFixed(0)}</span>
            <span className="text-sm font-normal text-text-secondary"> per week</span>
          </p>
          <p className="text-sm leading-sm">
            <span className="price font-semibold text-verified">₹{(perVisitWeekly / 100).toFixed(0)}/visit</span>
            <span className="price ml-2 text-text-secondary line-through">₹{(oneOff / 100).toFixed(0)}</span>
            <span className="ml-1 text-text-secondary">— {WEEKLY_DISCOUNT_PCT}% less than booking one at a time</span>
          </p>
          <p className="text-xs leading-sm text-text-secondary">Cancel or change your plan anytime — no lock-in</p>
          <Link href="/search" className="min-h-tap mt-2 flex items-center justify-center rounded-md bg-accent text-sm font-semibold text-white transition-colors hover:bg-accent-hover">
            See weekly plans
          </Link>
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        {FAQ.map((item) => (
          <Card key={item.q}>
            <p className="font-medium text-text-primary">{item.q}</p>
            <p className="mt-1 text-sm leading-sm text-text-secondary">{item.a}</p>
          </Card>
        ))}
      </div>
    </div></main>
  );
}

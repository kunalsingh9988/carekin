import Link from "next/link";
import { oneOffVisitPricePaise, weeklyPlanPricePaise, WEEKLY_DISCOUNT_PCT } from "@/lib/business";
import { Card } from "@/components/ui/Card";

const FAQ = [
  { q: "Is the commission included in the price I see?", a: "Yes. The price shown is the full price — nothing is added at checkout." },
  { q: "Can I switch from one-off to a weekly plan later?", a: "Yes, anytime from your booking, with one tap." },
  { q: "What if I need to cancel?", a: "Free cancellation up to 4 hours before a scheduled visit." },
];

export default function PricingPage() {
  const oneOff = oneOffVisitPricePaise();
  const weekly = weeklyPlanPricePaise();

  return (
    <main className="mx-auto flex max-w-3xl flex-1 flex-col gap-10 px-6 py-16">
      <div className="text-center">
        <h1 className="text-3xl font-semibold text-text-primary">Simple pricing. No surprise fees at checkout.</h1>
        <p className="mt-2 text-text-secondary">
          What you see here is what you pay — our commission is already included, not added later.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="flex flex-col gap-3">
          <p className="text-lg font-semibold text-text-primary">Pay per visit</p>
          <p className="text-sm text-text-secondary">Best for occasional or one-time care needs</p>
          <p className="mt-2 text-2xl font-semibold text-accent-text">
            From ₹{(oneOff / 100).toFixed(0)}<span className="text-sm font-normal text-text-secondary"> per visit</span>
          </p>
          <Link href="/search" className="min-h-tap mt-2 flex items-center justify-center rounded-md border border-border text-sm font-semibold text-text-primary">
            Search one-off availability
          </Link>
        </Card>

        <Card className="flex flex-col gap-3 border-2 border-accent">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent-text">Most families choose this</p>
          <p className="text-lg font-semibold text-text-primary">Save {WEEKLY_DISCOUNT_PCT}% vs. booking one-off</p>
          <p className="text-sm text-text-secondary">Best for ongoing elder care or regular babysitting</p>
          <p className="mt-2 text-2xl font-semibold text-accent-text">
            From ₹{(weekly / 100).toFixed(0)}<span className="text-sm font-normal text-text-secondary"> per week</span>
          </p>
          <p className="text-xs text-text-secondary">Cancel or change your plan anytime — no lock-in</p>
          <Link href="/search" className="min-h-tap mt-2 flex items-center justify-center rounded-md bg-accent text-sm font-semibold text-white">
            See weekly plans
          </Link>
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        {FAQ.map((item) => (
          <Card key={item.q}>
            <p className="font-medium text-text-primary">{item.q}</p>
            <p className="mt-1 text-sm text-text-secondary">{item.a}</p>
          </Card>
        ))}
      </div>
    </main>
  );
}

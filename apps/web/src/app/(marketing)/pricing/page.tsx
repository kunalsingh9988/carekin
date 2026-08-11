import { Card } from "@/components/ui/Card";

export default function PricingPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-1 flex-col gap-10 px-6 py-16">
      <div className="text-center">
        <h1 className="text-3xl font-semibold text-text-primary">Pricing</h1>
        <p className="mt-2 text-text-secondary">Simple, transparent — pay for the care you book, nothing else.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="flex flex-col gap-3">
          <p className="text-lg font-semibold text-text-primary">One-off booking</p>
          <p className="text-sm text-text-secondary">Pay per visit, by the hour. Ideal for occasional support or trying a provider before committing.</p>
          <p className="mt-2 text-2xl font-semibold text-accent-text">₹500–800<span className="text-sm font-normal text-text-secondary">/hour</span></p>
        </Card>
        <Card className="flex flex-col gap-3">
          <p className="text-lg font-semibold text-text-primary">Recurring plan</p>
          <p className="text-sm text-text-secondary">Weekly or monthly, with the same provider each time. Best for ongoing elder care or regular babysitting.</p>
          <p className="mt-2 text-2xl font-semibold text-accent-text">Custom<span className="text-sm font-normal text-text-secondary"> — set at booking</span></p>
        </Card>
      </div>

      <Card>
        <p className="font-medium text-text-primary">What CareKin keeps</p>
        <p className="mt-1 text-sm text-text-secondary">
          A platform commission (15–20%) is included in every booking price — it funds verification, support, and
          the trust layer that makes CareKin different. There are no separate booking fees.
        </p>
      </Card>
    </main>
  );
}

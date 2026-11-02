import { Card } from "@/components/ui/Card";
import type { PendingBooking } from "@/lib/storage/types";

// Carried through every step of the booking funnel (Section 4, Step 3-6) —
// the visible proof that the guest's selection survived the signup gate.
export function BookingSummaryCard({ providerName, pending }: { providerName: string; pending: PendingBooking }) {
  const priceLabel =
    pending.type === "subscription" ? `₹${(pending.amountPaise / 100).toFixed(0)}/week` : `₹${(pending.amountPaise / 100).toFixed(0)}`;

  return (
    <Card className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-text-primary">{providerName}</p>
        <p className="text-xs text-text-secondary">{pending.type === "subscription" ? "Weekly plan" : "One-off visit"}</p>
      </div>
      <p className="price text-sm font-semibold text-accent-text">{priceLabel}</p>
    </Card>
  );
}

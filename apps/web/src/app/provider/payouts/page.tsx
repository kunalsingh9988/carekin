"use client";

import { useEffect, useState } from "react";
import { Wallet } from "lucide-react";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { getMyProvider } from "@/lib/storage/repositories/providers";
import { listPayoutsForProvider } from "@/lib/storage/repositories/payouts";
import type { Payout, Provider } from "@/lib/storage/types";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

export default function ProviderPayoutsPage() {
  const user = useRequireRole("provider");
  const [provider, setProvider] = useState<Provider | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);

  useEffect(() => {
    if (!user) return;
    getMyProvider(user.id).then((p) => {
      setProvider(p);
      if (p) listPayoutsForProvider(p.id).then(setPayouts);
    });
  }, [user]);

  if (!user) return null;
  if (!provider) {
    return (
      <main className="mx-auto flex max-w-md flex-1 items-center justify-center px-6 text-center">
        <p className="text-text-secondary">Finish setting up your provider profile first.</p>
      </main>
    );
  }

  const pendingTotal = payouts.filter((p) => p.status === "pending").reduce((sum, p) => sum + p.amount_paise, 0);
  const paidTotal = payouts.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.amount_paise, 0);

  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col gap-6 px-6 py-8">
      <h1 className="text-2xl font-semibold text-text-primary">Payouts</h1>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <p className="text-sm text-text-secondary">Pending</p>
          <p className="price text-xl font-semibold text-text-primary">₹{(pendingTotal / 100).toFixed(0)}</p>
        </Card>
        <Card>
          <p className="text-sm text-text-secondary">Paid out</p>
          <p className="price text-xl font-semibold text-verified">₹{(paidTotal / 100).toFixed(0)}</p>
        </Card>
      </div>

      {payouts.length === 0 ? (
        <EmptyState icon={Wallet} title="No payouts yet" body="Payouts are created once a booking is marked completed." />
      ) : (
        <div className="flex flex-col gap-2">
          {payouts.map((p) => (
            <Card key={p.id} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-primary">₹{(p.amount_paise / 100).toFixed(0)}</p>
                <p className="text-xs text-text-secondary">{new Date(p.created_at).toLocaleDateString()}</p>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${p.status === "paid" ? "bg-verified/10 text-verified" : "bg-surface-secondary text-text-secondary"}`}>
                {p.status === "paid" ? "Paid" : "Pending"}
              </span>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}

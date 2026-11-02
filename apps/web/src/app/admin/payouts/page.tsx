"use client";

import { useEffect, useState } from "react";
import { Wallet } from "lucide-react";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { listAllPayouts, simulatePayoutRun } from "@/lib/storage/repositories/payouts";
import { getProvider } from "@/lib/storage/repositories/providers";
import type { Payout, Provider } from "@/lib/storage/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

export default function AdminPayoutsPage() {
  const user = useRequireRole("admin");
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [providers, setProviders] = useState<Record<string, Provider>>({});
  const [running, setRunning] = useState(false);

  async function load() {
    const list = await listAllPayouts();
    setPayouts(list);
    const entries = await Promise.all([...new Set(list.map((p) => p.provider_id))].map(async (id) => [id, await getProvider(id)] as const));
    setProviders(Object.fromEntries(entries.filter(([, v]) => v) as [string, Provider][]));
  }

  useEffect(() => {
    if (user) Promise.resolve().then(load);
  }, [user]);

  if (!user) return null;

  async function handleRun() {
    setRunning(true);
    await simulatePayoutRun();
    await load();
    setRunning(false);
  }

  const pendingCount = payouts.filter((p) => p.status === "pending").length;

  return (
    <main className="mx-auto flex max-w-3xl flex-1 flex-col gap-6 px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary">Payouts</h1>
        <Button onClick={handleRun} disabled={running || pendingCount === 0}>
          {running ? "Running…" : `Simulate payout run (${pendingCount} pending)`}
        </Button>
      </div>

      {payouts.length === 0 ? (
        <EmptyState icon={Wallet} title="No payouts yet" />
      ) : (
        <div className="flex flex-col gap-2">
          {payouts.map((p) => (
            <Card key={p.id} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-primary">{providers[p.provider_id]?.name ?? "Provider"}</p>
                <p className="text-xs text-text-secondary">₹{(p.amount_paise / 100).toFixed(0)}</p>
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

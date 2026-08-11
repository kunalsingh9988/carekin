"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { approveProvider, listPendingVerifications, rejectProvider } from "@/lib/storage/repositories/admin";
import { addNotification } from "@/lib/storage/repositories/notifications";
import type { Provider } from "@/lib/storage/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { VerificationTrail } from "@/components/verification/VerificationTrail";

// The one flow that should NOT auto-resolve — status only changes via this
// admin action (Guardrails, Section 8), same "human always decides" rule
// as the real backend's review_verification() RPC.
export default function VerificationQueuePage() {
  const user = useRequireRole("admin");
  const [pending, setPending] = useState<Provider[]>([]);

  async function load() {
    setPending(await listPendingVerifications());
  }

  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!user) return null;

  async function handleApprove(provider: Provider) {
    await approveProvider(provider.id, user!.id);
    await addNotification(provider.user_id, "verification_update", "You're verified! You're now visible to families nearby.");
    load();
  }

  async function handleReject(provider: Provider) {
    const reason = window.prompt("Reason for rejection (shown to the provider):");
    if (!reason) return;
    await rejectProvider(provider.id, reason, user!.id);
    await addNotification(provider.user_id, "verification_update", `Your application wasn't approved: ${reason}`);
    load();
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold text-text-primary">Verification queue</h1>

      {pending.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="No pending providers" body="New applications will show up here for review." />
      ) : (
        <ul className="flex flex-col gap-4">
          {pending.map((p) => (
            <li key={p.id}>
              <Card className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-text-primary">
                      {p.type === "caregiver" ? "Elder caregiver" : "Babysitter"} · {p.name}
                    </p>
                    <p className="text-sm text-text-secondary">{p.phone}</p>
                    {p.bio && <p className="mt-1 text-sm text-text-secondary">{p.bio}</p>}
                  </div>
                  <VerificationTrail status={p.verification_status} size="micro" />
                </div>
                <div className="flex gap-2">
                  <Button variant="danger" onClick={() => handleReject(p)} className="flex-1">
                    Reject
                  </Button>
                  <Button onClick={() => handleApprove(p)} className="flex-1">
                    Approve
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

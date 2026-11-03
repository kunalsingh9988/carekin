"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { approveProvider, listPendingVerifications, rejectProvider } from "@/lib/storage/repositories/admin";
import { getDocuments } from "@/lib/storage/repositories/providers";
import { addNotification } from "@/lib/storage/repositories/notifications";
import type { Provider, ProviderDocument } from "@/lib/storage/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { TextAreaField } from "@/components/ui/FormField";
import { VerificationTrail } from "@/components/verification/VerificationTrail";

// The one flow that should NOT auto-resolve — status only changes via this
// admin action (Guardrails, Section 8), same "human always decides" rule as
// the real backend's review_verification() RPC.
export default function VerificationQueuePage() {
  const user = useRequireRole("admin");
  const [pending, setPending] = useState<Provider[]>([]);
  const [documents, setDocuments] = useState<Record<string, ProviderDocument[]>>({});
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  async function load() {
    const list = await listPendingVerifications();
    setPending(list);
    const docEntries = await Promise.all(list.map(async (p) => [p.id, await getDocuments(p.id)] as const));
    setDocuments(Object.fromEntries(docEntries));
  }

  useEffect(() => {
    if (user) Promise.resolve().then(load);
  }, [user]);

  if (!user) return null;

  async function handleApprove(provider: Provider) {
    await approveProvider(provider.id, user!.id);
    await addNotification(provider.user_id, "verification_update", "You're verified! You're now visible to families nearby.");
    load();
  }

  async function handleReject(provider: Provider) {
    if (!rejectReason.trim()) return;
    await rejectProvider(provider.id, rejectReason.trim(), user!.id);
    await addNotification(provider.user_id, "verification_update", `Your application wasn't approved: ${rejectReason.trim()}`);
    setRejectingId(null);
    setRejectReason("");
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
                <Link href={`/admin/providers/${p.id}`} className="min-h-tap py-3 text-sm font-semibold text-accent-text">Open full provider review →</Link>
                <div className="flex flex-col items-start gap-3 sm:flex-row sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium text-text-primary">
                      {p.type === "caregiver" ? "Elder caregiver" : "Babysitter"} · {p.name}
                    </p>
                    <p className="text-sm text-text-secondary">{p.phone}</p>
                    {p.bio && <p className="mt-1 text-sm text-text-secondary">{p.bio}</p>}
                  </div>
                  <VerificationTrail status={p.verification_status} size="micro" />
                </div>

                {(documents[p.id]?.length ?? 0) > 0 && (
                  <div className="flex flex-col gap-1 border-t border-border pt-2">
                    <p className="text-xs font-semibold text-text-secondary">Submitted documents</p>
                    {documents[p.id].map((d) => (
                      <p key={d.id} className="text-sm text-text-secondary">
                        {d.type.replace(/_/g, " ")} · {d.filename} · <span className="text-xs">{d.status}</span>
                      </p>
                    ))}
                  </div>
                )}

                {rejectingId === p.id ? (
                  <div className="flex flex-col gap-2">
                    <TextAreaField
                      label="Reason for rejection (shown to the provider)"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="e.g. ID document unclear — please re-upload"
                    />
                    <div className="flex gap-2">
                      <Button variant="secondary" onClick={() => { setRejectingId(null); setRejectReason(""); }} className="flex-1">
                        Back
                      </Button>
                      <Button variant="danger" onClick={() => handleReject(p)} disabled={!rejectReason.trim()} className="flex-1">
                        Confirm rejection
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="danger" onClick={() => setRejectingId(p.id)} className="flex-1">
                      Reject
                    </Button>
                    <Button onClick={() => handleApprove(p)} className="flex-1">
                      Approve
                    </Button>
                  </div>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

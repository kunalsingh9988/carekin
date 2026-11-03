"use client";
import { useCallback, useEffect } from "react";
import Link from "next/link";
import type { CurrentUser } from "@/lib/storage/types";
import { useResource } from "@/lib/hooks/useResource";
import { getCareContext } from "@/lib/storage/repositories/care";
import { SafetyToolkit } from "./SafetyToolkit";
import { PHASE_LABELS } from "./ActiveCare";
export function ChatCareHeader({ id, user }: { id: string; user: CurrentUser }) {
  const loader = useCallback(() => getCareContext(user, id), [id, user]);
  const { data, error, reload } = useResource(loader);
  useEffect(() => { const interval = setInterval(reload, 3000); return () => clearInterval(interval); }, [reload]);
  if (error) return <p role="alert" className="text-sm text-danger">Visit context unavailable. For immediate danger, <a href="tel:112" className="underline">call 112</a>.</p>;
  if (!data) return <p className="text-sm text-text-secondary">Loading visit context…</p>;
  return <section className="flex shrink-0 flex-col gap-3 rounded-lg border border-border bg-surface p-3" aria-label="Chat visit safety header"><div><h1 className="text-lg font-semibold">{PHASE_LABELS[data.visit.phase]}</h1><p className="mt-1 text-sm text-text-secondary">For {data.recipientName} · With {data.provider.name.split(" ")[0]} · {data.provider.approved ? "Approved demo profile" : "Not approved"}</p><p className="mt-1 text-xs text-text-secondary">{new Date(data.booking.scheduled_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} · {data.booking.duration_hours} hours · device-local demo</p></div><div className="flex flex-wrap items-center gap-3"><SafetyToolkit user={user} context={data} onChange={reload} /><Link href={`/${user.role}/bookings/${id}/active`} className="flex min-h-tap items-center text-sm font-semibold text-accent-text">Visit details / check-out →</Link><a href="tel:112" className="flex min-h-tap items-center text-xs font-semibold text-danger">Immediate danger? Call 112</a></div></section>;
}

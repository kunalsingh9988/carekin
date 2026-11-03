"use client";
import { useCallback } from "react";
import { Shield } from "lucide-react";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { useResource } from "@/lib/hooks/useResource";
import { getFamilyProfile } from "@/lib/storage/repositories/families";
import { getMyProvider } from "@/lib/storage/repositories/providers";
import { listBookingsForFamily, listBookingsForProvider } from "@/lib/storage/repositories/bookings";
import { getCareContext } from "@/lib/storage/repositories/care";
import { PHASE_LABELS } from "./ActiveCare";
import { LinkButton } from "@/components/ui/Button";

export function ActiveCareEntry({ role }: { role: "family" | "provider" }) {
  const user = useRequireRole(role);
  const loader = useCallback(async () => {
    if (!user) return [];
    const profile = role === "family" ? await getFamilyProfile(user.id) : await getMyProvider(user.id);
    if (!profile) return [];
    const bookings = role === "family" ? await listBookingsForFamily(profile.id) : await listBookingsForProvider(profile.id);
    const visits = await Promise.all(bookings.filter((b) => ["confirmed", "in_progress"].includes(b.status)).map((b) => getCareContext(user, b.id)));
    return visits.sort((a, b) => (b.visit.phase === "active" ? 1 : 0) - (a.visit.phase === "active" ? 1 : 0)).slice(0, 3);
  }, [role, user]);
  const { data } = useResource(loader);
  if (!data?.length) return null;
  return <section aria-label="Active and upcoming care" className="flex flex-col gap-3">{data.map((c) => <article key={c.booking.id} className="rounded-lg bg-accent-tint p-4"><p className="flex items-center gap-2 font-semibold text-accent-text"><Shield className="h-5 w-5" />{PHASE_LABELS[c.visit.phase]}</p><p className="mt-2 text-sm text-text-primary">For {c.recipientName} · With {c.provider.name.split(" ")[0]}</p><p className="mt-1 text-xs text-text-secondary">{new Date(c.booking.scheduled_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} · Demo visit</p><LinkButton href={`/${role}/bookings/${c.booking.id}/active`} variant="secondary" className="mt-4">Open Active Care & safety</LinkButton></article>)}</section>;
}

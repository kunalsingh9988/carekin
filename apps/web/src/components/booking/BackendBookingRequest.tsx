"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { getPendingBooking, clearPendingBooking } from "@/lib/storage/session";
import { getFamilyProfile } from "@/lib/storage/repositories/families";
import { createBooking, createLocalBooking } from "@/lib/storage/repositories/bookings";
import { isDevelopmentProviderId } from "@/lib/development-providers";
import type { PendingBooking } from "@/lib/storage/types";
import { Button, LinkButton } from "@/components/ui/Button";
export function BackendBookingRequest({ providerId }: { providerId: string }) {
  const user=useRequireRole("family"),router=useRouter();
  const isDemoProvider=isDevelopmentProviderId(providerId);
  const [pending,setPending]=useState<PendingBooking|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState("");
  useEffect(()=>{ queueMicrotask(()=>setPending(getPendingBooking())); },[]);
  async function submit() {
    if(!user || !pending || pending.providerId!==providerId || !pending.careRecipientId) return;
    setBusy(true); setError("");
    try {
      const family=await getFamilyProfile(user.id); if(!family) throw new Error("Complete your family profile first.");
      const input={ familyId:family.id,providerId,careRecipientId:pending.careRecipientId,type:"one_off" as const,scheduledAt:new Date(`${pending.scheduledDate}T${pending.scheduledTime || "10:00"}:00+05:30`).toISOString(),durationHours:pending.durationHours,amountPaise:0 };
      // Demo providers are fictional — their bookings are saved on this
      // device only. No real person is notified and nothing can be accepted.
      const booking=isDemoProvider ? await createLocalBooking(input) : await createBooking(input);
      clearPendingBooking(); router.push(`/family/bookings/${booking.id}`);
    } catch(e) { setError(e instanceof Error?e.message:"Unable to request the visit."); } finally { setBusy(false); }
  }
  return <main className="mx-auto flex w-full max-w-lg flex-col gap-5 px-6 py-12"><h1 className="text-2xl font-semibold">Request your visit</h1>{isDemoProvider ? <p className="rounded-lg bg-accent-tint p-4 text-sm text-text-primary">Demo booking: this provider is a fictional test profile. The request is saved on this device only — no real person is notified and no visit will take place.</p> : <p className="rounded-lg bg-accent-tint p-4 text-sm text-text-primary">Development booking: no payment will be taken and no payout will be created. The provider must accept this request. Do not use development bookings to arrange real care.</p>}{!pending || pending.providerId!==providerId ? <LinkButton href={`/book/${providerId}`}>Choose a visit</LinkButton> : pending.type!=="one_off" ? <><p>Recurring plans and billing are not connected yet. Choose a one-off visit to test the booking workflow.</p><LinkButton href={`/book/${providerId}`}>Change visit type</LinkButton></> : <><p>{pending.scheduledDate} · {pending.scheduledTime} India time · {pending.durationHours} hours</p><p className="text-sm text-text-secondary">The saved quote is calculated by the server. Provider availability and overlapping visits are checked before saving.</p><Button onClick={submit} disabled={busy || !user || !pending.careRecipientId}>{busy?"Saving request…":"Request development visit"}</Button></>}{error && <p role="alert" className="text-danger">{error}</p>}</main>;
}

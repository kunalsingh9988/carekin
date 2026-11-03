"use client";
import { backendEnabled } from "@/lib/backend/config";
import { useCallback, useState } from "react";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { useResource } from "@/lib/hooks/useResource";
import { getBooking } from "@/lib/storage/repositories/bookings";
import { getProvider } from "@/lib/storage/repositories/providers";
import { getFamilyProfileById, getCareRecipient } from "@/lib/storage/repositories/families";
import { getPaymentForBooking } from "@/lib/storage/repositories/payments";
import { performBookingAction } from "@/lib/storage/repositories/workspace";
import { getCareContext } from "@/lib/storage/repositories/care";
import { PageShell, Notice, DetailRows } from "./PageShell";
import { Button, LinkButton } from "@/components/ui/Button";
import { BookingStatusBadge } from "@/components/ui/BookingStatusBadge";

type Action = "accept" | "decline" | "start" | "complete" | "cancel";
const LABELS: Record<Action, string> = { accept: "Accept demo booking", decline: "Decline demo request", start: "Start demo visit", complete: "Complete demo visit", cancel: "Cancel demo booking" };
export function BookingDetail({ id, role }: { id: string; role: "provider" | "admin" }) {
  const user = useRequireRole(role);
  const loader = useCallback(async () => {
    if (!user) return null;
    const booking = await getBooking(id);
    if (!booking) return null;
    const provider = await getProvider(booking.provider_id);
    if (role === "provider" && provider?.user_id !== user.id) return null;
    const context = role === "provider" ? await getCareContext(user, id) : null;
    const recipient = context ? { name: context.recipientName, notes: context.careNotes ?? "Care notes are hidden outside an active visit." } : await getCareRecipient(booking.care_recipient_id);
    return { booking, provider, family: context ? { name: context.familyName } : await getFamilyProfileById(booking.family_id), recipient, payment: await getPaymentForBooking(id) };
  }, [id, role, user]);
  const { data, error, reload } = useResource(loader);
  const [action, setAction] = useState<Action | null>(null), [busy, setBusy] = useState(false), [message, setMessage] = useState(""), [actionError, setActionError] = useState("");
  async function apply() { if (!user || !action) return; setBusy(true); setActionError(""); try { await performBookingAction(user, id, action); setMessage("Booking updated. No charge, refund or bank transfer was initiated."); setAction(null); reload(); } catch(e) { setActionError(e instanceof Error ? e.message : "Unable to update booking."); } finally { setBusy(false); } }
  return <PageShell title="Every visit, all the details." description="Review the schedule, people and recorded payment before taking an action." back={{ href: `/${role}/bookings`, label: "All bookings" }}>
    {error ? <Notice error>{error}</Notice> : data === undefined ? <Notice>Loading booking…</Notice> : !data ? <Notice error>This booking is unavailable for your account.</Notice> : <>
      <div className="flex flex-wrap items-center gap-4"><h2 className="text-2xl font-semibold">{data.family?.name ?? "Family"} with {data.provider?.name ?? "Provider"}</h2><BookingStatusBadge status={data.booking.status} /></div>
      <div className="grid gap-8 md:grid-cols-[1.3fr_0.7fr]"><section><DetailRows rows={[["Booking reference", id], ["Visit time", new Date(data.booking.scheduled_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })], ["Duration", `${data.booking.duration_hours} hours`], ["Care recipient", data.recipient?.name ?? "Unavailable"], ["Care notes", data.recipient?.notes || "No notes supplied"], ["Plan", data.booking.type === "one_off" ? "One-off visit" : "Care plan visit"], ["Recorded amount", `₹${(data.booking.amount_paise / 100).toLocaleString("en-IN")}`], ["Platform commission", `₹${(data.booking.commission_paise / 100).toLocaleString("en-IN")}`], ["Provider earnings before adjustments", `₹${((data.booking.amount_paise - data.booking.commission_paise) / 100).toLocaleString("en-IN")}`], ["Payment status", data.payment?.status ?? "No payment recorded"]]} />{role === "admin" && <div className="mt-6 flex flex-wrap gap-3"><LinkButton href={`/admin/providers/${data.booking.provider_id}`} variant="secondary">Provider record</LinkButton><LinkButton href="/admin/disputes" variant="secondary">Review disputes</LinkButton></div>}</section><aside className="flex flex-col gap-4 self-start rounded-lg bg-surface-secondary p-6"><h2 className="text-xl font-semibold">Visit actions</h2><p className="text-sm leading-sm text-text-secondary">Development requests do not involve payment. Active Care records arrival and family-confirmed departure. No bank transfer is initiated here.</p>{action ? <><p className="text-sm font-semibold">{LABELS[action]}?</p><Button disabled={busy} onClick={apply}>{busy ? "Saving…" : "Confirm action"}</Button><Button variant="secondary" disabled={busy} onClick={() => setAction(null)}>Go back</Button></> : <>
        {data.booking.status === "requested" && <>{(backendEnabled || data.payment?.status === "captured") && data.provider?.verification_status === "approved" ? <Button onClick={() => setAction("accept")}>{backendEnabled ? "Accept development request" : LABELS.accept}</Button> : <p className="text-sm text-text-secondary">Acceptance requires provider approval and payment, except unpaid development requests.</p>}<Button variant="secondary" onClick={() => setAction("decline")}>{backendEnabled ? "Decline request" : LABELS.decline}</Button></>}
        {["confirmed", "in_progress"].includes(data.booking.status) && (role === "provider" ? <LinkButton href={`/provider/bookings/${id}/active`}>Active Care · check-in / check-out</LinkButton> : <p className="text-sm text-text-secondary">Check-in and check-out are managed by participants in Active Care.</p>)}
        {role === "admin" && ["requested", "confirmed"].includes(data.booking.status) && <Button variant="secondary" onClick={() => setAction("cancel")}>{LABELS.cancel}</Button>}
        {["completed", "cancelled", "disputed"].includes(data.booking.status) && <p className="text-sm text-text-secondary">No further lifecycle actions are available in this state.</p>}
      </>}{role === "provider" && ["confirmed", "in_progress", "completed"].includes(data.booking.status) && <LinkButton href={`/provider/bookings/${id}/chat`} variant="secondary">Open booking chat</LinkButton>}</aside></div>{message && <Notice>{message}</Notice>}{actionError && <Notice error>{actionError}</Notice>}
    </>}
  </PageShell>;
}

"use client";
import { backendEnabled } from "@/lib/backend/config";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle, Star } from "lucide-react";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { getBooking, updateBookingStatus } from "@/lib/storage/repositories/bookings";
import { getProvider } from "@/lib/storage/repositories/providers";
import { getCareRecipient, getFamilyProfile } from "@/lib/storage/repositories/families";
import { getReviewForBooking } from "@/lib/storage/repositories/reviews";
import { raiseDispute } from "@/lib/storage/repositories/admin";
import type { Booking, CareRecipient, Provider, Review } from "@/lib/storage/types";
import { Button, LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { BookingStatusBadge } from "@/components/ui/BookingStatusBadge";
import { TextAreaField } from "@/components/ui/FormField";

const CHAT_UNLOCKED: Booking["status"][] = ["confirmed", "in_progress", "completed"];
const DISPUTABLE: Booking["status"][] = ["confirmed", "in_progress", "completed"];

export default function FamilyBookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const user = useRequireRole("family");
  const [booking, setBooking] = useState<Booking | null | undefined>(undefined);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [recipient, setRecipient] = useState<CareRecipient | null>(null);
  const [review, setReview] = useState<Review | null>(null);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeSubmitting, setDisputeSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    getBooking(id).then(async (b) => {
      if (!b) {
        setBooking(null);
        return;
      }
      // Ownership: a booking belongs to exactly one family — another
      // family's id guessed in the URL must not resolve.
      const family = await getFamilyProfile(user.id);
      if (!family || b.family_id !== family.id) {
        setBooking(null);
        return;
      }
      setBooking(b);
      getProvider(b.provider_id).then(setProvider);
      getCareRecipient(b.care_recipient_id).then(setRecipient);
      getReviewForBooking(b.id).then(setReview);
    }).catch(e => setError(e instanceof Error ? e.message : "Unable to load booking."));
  }, [id, user]);

  if (!user) return null;
  if (error) return <main className="mx-auto p-8"><p role="alert" className="text-danger">{error}</p><Link href="/family/bookings">Back to bookings</Link></main>;
  if (booking === null) notFound();
  if (booking === undefined) return null;

  async function handleCancelRequest() {
    try { const updated = await updateBookingStatus(booking!.id, "cancelled"); setBooking(updated); }
    catch(e) { setError(e instanceof Error ? e.message : "Unable to cancel."); }
  }

  async function handleRaiseDispute(e: React.FormEvent) {
    e.preventDefault();
    if (!disputeReason.trim() || !booking) return;
    setDisputeSubmitting(true);
    try {
      await raiseDispute(booking.id, user!.id, disputeReason.trim());
      const updated = backendEnabled ? await getBooking(booking.id) : await updateBookingStatus(booking.id, "disputed");
      setBooking(updated); setDisputeOpen(false);
    } catch(e) { setError(e instanceof Error ? e.message : "Unable to record dispute."); }
    finally { setDisputeSubmitting(false); }
  }

  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col gap-6 px-6 py-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">{provider?.name ?? "Provider"}</h1>
          <p className="text-sm text-text-secondary">{new Date(booking.scheduled_at).toLocaleString()}</p>
        </div>
        <BookingStatusBadge status={booking.status} />
      </div>

      <Card className="flex flex-col gap-2 text-sm">
        <Row label="For" value={recipient?.name ?? "—"} />
        <Row label="Duration" value={`${booking.duration_hours} hours`} />
        <Row label="Amount" value={`₹${(booking.amount_paise / 100).toFixed(0)}`} />
        {booking.type === "subscription" && <Row label="Plan" value="Weekly plan" />}
      </Card>
      <LinkButton href={`/family/bookings/${booking.id}/active`} variant="secondary" fullWidth>Active Care · safety & visit timeline</LinkButton>

      {["requested", "confirmed"].includes(booking.status) && <LinkButton href={`/family/bookings/${booking.id}/reschedule`} variant="secondary" fullWidth>Reschedule this visit</LinkButton>}
      {booking.subscription_id && <LinkButton href={`/family/plans/${booking.subscription_id}`} variant="secondary" fullWidth>Manage care plan</LinkButton>}

      {CHAT_UNLOCKED.includes(booking.status) ? (
        <LinkButton href={`/family/bookings/${booking.id}/chat`} variant="secondary" fullWidth>
          <MessageCircle className="h-4 w-4" /> Open chat
        </LinkButton>
      ) : (
        <p className="text-center text-sm text-text-secondary">Chat unlocks once this booking is confirmed.</p>
      )}

      {booking.status === "requested" && (
        <div className="flex flex-col gap-2">
          <p className="text-center text-sm text-text-secondary">{backendEnabled ? "Unpaid development request. Waiting for the provider to accept." : "This request isn’t paid yet — payment didn’t complete."}</p>
          <Button variant="secondary" onClick={handleCancelRequest} fullWidth>
            Cancel this request
          </Button>
        </div>
      )}

      {booking.status === "completed" && !review && (
        <LinkButton href={`/family/bookings/${booking.id}/review`} fullWidth>
          <Star className="h-4 w-4" /> Leave a review
        </LinkButton>
      )}
      {booking.status === "completed" && (
        <LinkButton href={`/family/bookings/${booking.id}/rebook`} variant="secondary" fullWidth>
          Book again
        </LinkButton>
      )}
      {review && (
        <Card>
          <p className="mb-1 text-sm font-medium text-text-primary">Your review</p>
          <div className="flex items-center gap-1 text-verified">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`h-3.5 w-3.5 ${i < review.rating ? "fill-verified" : "fill-border"}`} />
            ))}
          </div>
          {review.comment && <p className="mt-1 text-sm text-text-secondary">{review.comment}</p>}
        </Card>
      )}

      {DISPUTABLE.includes(booking.status) &&
        (disputeOpen ? (
          <form onSubmit={handleRaiseDispute} className="flex flex-col gap-3">
            <TextAreaField
              label="What went wrong?"
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="Describe the issue — our team reviews every dispute."
            />
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={() => setDisputeOpen(false)} fullWidth>
                Keep booking
              </Button>
              <Button type="submit" variant="danger" disabled={disputeSubmitting || !disputeReason.trim()} fullWidth>
                Raise dispute
              </Button>
            </div>
          </form>
        ) : (
          <button onClick={() => setDisputeOpen(true)} className="text-center text-sm text-text-secondary underline">
            Something wrong with this booking?
          </button>
        ))}

      <Link href="/family/bookings" className="text-center text-sm text-text-secondary underline">
        Back to bookings
      </Link>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-text-secondary">{label}</span>
      <span className="font-medium text-text-primary">{value}</span>
    </div>
  );
}

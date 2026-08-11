"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle, Star } from "lucide-react";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { getBooking } from "@/lib/storage/repositories/bookings";
import { getProvider } from "@/lib/storage/repositories/providers";
import { getCareRecipient } from "@/lib/storage/repositories/families";
import { getReviewForBooking } from "@/lib/storage/repositories/reviews";
import type { Booking, CareRecipient, Provider, Review } from "@/lib/storage/types";
import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { BookingStatusBadge } from "@/components/ui/BookingStatusBadge";

const CHAT_UNLOCKED: Booking["status"][] = ["confirmed", "in_progress", "completed"];

export default function FamilyBookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const user = useRequireRole("family");
  const [booking, setBooking] = useState<Booking | null | undefined>(undefined);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [recipient, setRecipient] = useState<CareRecipient | null>(null);
  const [review, setReview] = useState<Review | null>(null);

  useEffect(() => {
    getBooking(id).then(async (b) => {
      setBooking(b);
      if (b) {
        getProvider(b.provider_id).then(setProvider);
        getCareRecipient(b.care_recipient_id).then(setRecipient);
        getReviewForBooking(b.id).then(setReview);
      }
    });
  }, [id]);

  if (!user) return null;
  if (booking === null) notFound();
  if (booking === undefined) return null;

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
      </Card>

      {CHAT_UNLOCKED.includes(booking.status) ? (
        <LinkButton href={`/family/bookings/${booking.id}/chat`} variant="secondary" fullWidth>
          <MessageCircle className="h-4 w-4" /> Open chat
        </LinkButton>
      ) : (
        <p className="text-center text-sm text-text-secondary">Chat unlocks once this booking is confirmed.</p>
      )}

      {booking.status === "completed" && !review && (
        <LinkButton href={`/family/bookings/${booking.id}/review`} fullWidth>
          <Star className="h-4 w-4" /> Leave a review
        </LinkButton>
      )}
      {review && (
        <Card>
          <p className="mb-1 text-sm font-medium text-text-primary">Your review</p>
          <div className="flex items-center gap-1 text-warning">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`h-3.5 w-3.5 ${i < review.rating ? "fill-warning" : ""}`} />
            ))}
          </div>
          {review.comment && <p className="mt-1 text-sm text-text-secondary">{review.comment}</p>}
        </Card>
      )}

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

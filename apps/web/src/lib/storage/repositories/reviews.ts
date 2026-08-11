import { get, newId, set } from "../client";
import type { Review } from "../types";

const KEY = "reviews";

export async function submitReview(
  bookingId: string,
  providerId: string,
  rating: number,
  comment?: string,
): Promise<Review> {
  const all = get<Review[]>(KEY, []);
  const created: Review = {
    id: newId(),
    booking_id: bookingId,
    provider_id: providerId,
    rating,
    comment: comment ?? null,
    created_at: new Date().toISOString(),
  };
  set(KEY, [...all, created]);
  return created;
}

export async function getReviewForBooking(bookingId: string): Promise<Review | null> {
  const all = get<Review[]>(KEY, []);
  return all.find((r) => r.booking_id === bookingId) ?? null;
}

export async function getReviewsForProvider(providerId: string): Promise<Review[]> {
  const all = get<Review[]>(KEY, []);
  return all.filter((r) => r.provider_id === providerId).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

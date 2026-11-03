import { backendEnabled } from "@/lib/backend/config";
import { remote } from "@/lib/backend/browser";
import { get, newId, set } from "../client";
import type { Review } from "../types";

const KEY = "reviews";

 async function demo_submitReview(
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

 async function demo_getReviewForBooking(bookingId: string): Promise<Review | null> {
  const all = get<Review[]>(KEY, []);
  return all.find((r) => r.booking_id === bookingId) ?? null;
}

 async function demo_getReviewsForProvider(providerId: string): Promise<Review[]> {
  const all = get<Review[]>(KEY, []);
  return all.filter((r) => r.provider_id === providerId).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

 async function demo_getRatingSummary(providerId: string): Promise<{ avg: number; count: number }> {
  const reviews = await getReviewsForProvider(providerId);
  if (reviews.length === 0) return { avg: 0, count: 0 };
  return { avg: reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length, count: reviews.length };
}

// Backend adapters
export const submitReview: typeof demo_submitReview = (...args) => backendEnabled ? remote("reviews.submitReview", args) : demo_submitReview(...args);
export const getReviewForBooking: typeof demo_getReviewForBooking = (...args) => backendEnabled ? remote("reviews.getReviewForBooking", args) : demo_getReviewForBooking(...args);
export const getReviewsForProvider: typeof demo_getReviewsForProvider = (...args) => backendEnabled ? remote("reviews.getReviewsForProvider", args) : demo_getReviewsForProvider(...args);
export const getRatingSummary: typeof demo_getRatingSummary = (...args) => backendEnabled ? remote("reviews.getRatingSummary", args) : demo_getRatingSummary(...args);

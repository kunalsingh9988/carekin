import { get, newId, set } from "../client";
import { DEFAULT_COMMISSION_RATE } from "../../business";
import type { Booking, BookingStatus, BookingType } from "../types";

const KEY = "bookings";

export interface CreateBookingInput {
  familyId: string;
  providerId: string;
  careRecipientId: string;
  type: BookingType;
  scheduledAt: string;
  durationHours: number;
  amountPaise: number;
  subscriptionId?: string | null;
}

export async function createBooking(input: CreateBookingInput): Promise<Booking> {
  const all = get<Booking[]>(KEY, []);
  const now = new Date().toISOString();
  const created: Booking = {
    id: newId(),
    family_id: input.familyId,
    provider_id: input.providerId,
    care_recipient_id: input.careRecipientId,
    type: input.type,
    status: "requested",
    scheduled_at: input.scheduledAt,
    duration_hours: input.durationHours,
    amount_paise: input.amountPaise,
    commission_paise: Math.round(input.amountPaise * DEFAULT_COMMISSION_RATE),
    subscription_id: input.subscriptionId ?? null,
    created_at: now,
    updated_at: now,
  };
  set(KEY, [...all, created]);
  return created;
}

export async function listBookingsForFamily(familyId: string): Promise<Booking[]> {
  const all = get<Booking[]>(KEY, []);
  return all.filter((b) => b.family_id === familyId).sort((a, b) => b.scheduled_at.localeCompare(a.scheduled_at));
}

export async function listBookingsForProvider(providerId: string): Promise<Booking[]> {
  const all = get<Booking[]>(KEY, []);
  return all.filter((b) => b.provider_id === providerId).sort((a, b) => b.scheduled_at.localeCompare(a.scheduled_at));
}

export async function listAllBookings(): Promise<Booking[]> {
  return get<Booking[]>(KEY, []).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function getBooking(id: string): Promise<Booking | null> {
  const all = get<Booking[]>(KEY, []);
  return all.find((b) => b.id === id) ?? null;
}

export async function updateBookingStatus(id: string, status: BookingStatus): Promise<Booking> {
  const all = get<Booking[]>(KEY, []);
  const existing = all.find((b) => b.id === id);
  if (!existing) throw new Error(`Booking ${id} not found`);
  const updated: Booking = { ...existing, status, updated_at: new Date().toISOString() };
  set(
    KEY,
    all.map((b) => (b.id === id ? updated : b)),
  );
  return updated;
}

export async function linkBookingToSubscription(id: string, subscriptionId: string): Promise<Booking> {
  const all = get<Booking[]>(KEY, []);
  const existing = all.find((b) => b.id === id);
  if (!existing) throw new Error(`Booking ${id} not found`);
  const updated: Booking = { ...existing, subscription_id: subscriptionId, updated_at: new Date().toISOString() };
  set(
    KEY,
    all.map((b) => (b.id === id ? updated : b)),
  );
  return updated;
}

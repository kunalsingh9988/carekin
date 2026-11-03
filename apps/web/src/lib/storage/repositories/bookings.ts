import { backendEnabled } from "@/lib/backend/config";
import { remote } from "@/lib/backend/browser";
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

 async function demo_createBooking(input: CreateBookingInput): Promise<Booking> {
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

 async function demo_listBookingsForFamily(familyId: string): Promise<Booking[]> {
  const all = get<Booking[]>(KEY, []);
  return all.filter((b) => b.family_id === familyId).sort((a, b) => b.scheduled_at.localeCompare(a.scheduled_at));
}

 async function demo_listBookingsForProvider(providerId: string): Promise<Booking[]> {
  const all = get<Booking[]>(KEY, []);
  return all.filter((b) => b.provider_id === providerId).sort((a, b) => b.scheduled_at.localeCompare(a.scheduled_at));
}

 async function demo_listAllBookings(): Promise<Booking[]> {
  return get<Booking[]>(KEY, []).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

 async function demo_getBooking(id: string): Promise<Booking | null> {
  const all = get<Booking[]>(KEY, []);
  return all.find((b) => b.id === id) ?? null;
}

 async function demo_updateBookingStatus(id: string, status: BookingStatus): Promise<Booking> {
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

 async function demo_linkBookingToSubscription(id: string, subscriptionId: string): Promise<Booking> {
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

// Backend adapters
export const createBooking: typeof demo_createBooking = (...args) => backendEnabled ? remote("bookings.createBooking", args) : demo_createBooking(...args);
export const listBookingsForFamily: typeof demo_listBookingsForFamily = (...args) => backendEnabled ? remote("bookings.listBookingsForFamily", args) : demo_listBookingsForFamily(...args);
export const listBookingsForProvider: typeof demo_listBookingsForProvider = (...args) => backendEnabled ? remote("bookings.listBookingsForProvider", args) : demo_listBookingsForProvider(...args);
export const listAllBookings: typeof demo_listAllBookings = (...args) => backendEnabled ? remote("bookings.listAllBookings", args) : demo_listAllBookings(...args);
export const getBooking: typeof demo_getBooking = (...args) => backendEnabled ? remote("bookings.getBooking", args) : demo_getBooking(...args);
export const updateBookingStatus: typeof demo_updateBookingStatus = (...args) => backendEnabled ? remote("bookings.updateBookingStatus", args) : demo_updateBookingStatus(...args);
export const linkBookingToSubscription: typeof demo_linkBookingToSubscription = (...args) => backendEnabled ? remote("bookings.linkBookingToSubscription", args) : demo_linkBookingToSubscription(...args);

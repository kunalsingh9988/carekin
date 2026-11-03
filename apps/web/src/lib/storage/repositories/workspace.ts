import { backendEnabled } from "@/lib/backend/config";
import { remote } from "@/lib/backend/browser";
import { get, newId, set } from "../client";
import type { Booking, FamilyProfile, Provider, Subscription, SubscriptionStatus, CurrentUser } from "../types";
import { getPaymentForBooking } from "./payments";
import { ensurePayoutForCompletedBooking } from "./payouts";

export interface AvailabilityDay { day: number; enabled: boolean; start: string; end: string }
export interface SupportDraft { id: string; name: string; email: string; topic: string; message: string; created_at: string }
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

 async function demo_getAvailability(providerId: string): Promise<AvailabilityDay[]> {
  return get<Record<string, AvailabilityDay[]>>("availability", {})[providerId] ?? Array.from({ length: 7 }, (_, day) => ({ day, enabled: false, start: "09:00", end: "17:00" }));
}
 async function demo_saveAvailability(userId: string, providerId: string, days: AvailabilityDay[]) {
  const provider = get<Provider[]>("providers", []).find((p) => p.id === providerId && p.user_id === userId);
  if (!provider) throw new Error("This provider profile is not yours.");
  if (days.length !== 7 || new Set(days.map((d) => d.day)).size !== 7 || days.some((d) => !Number.isInteger(d.day) || d.day < 0 || d.day > 6 || !TIME.test(d.start) || !TIME.test(d.end) || (d.enabled && d.start >= d.end))) throw new Error("Choose seven unique days and an end time after the start time.");
  set("availability", { ...get<Record<string, AvailabilityDay[]>>("availability", {}), [providerId]: days });
}
 async function demo_updatePublicProfile(userId: string, input: { name: string; bio: string; radius: number }) {
  if (!input.name.trim() || input.name.trim().length > 100 || input.bio.length > 1200 || !Number.isFinite(input.radius) || input.radius < 1 || input.radius > 50) throw new Error("Add a name, a bio under 1,200 characters and a service radius from 1–50 km.");
  const providers = get<Provider[]>("providers", []);
  const current = providers.find((p) => p.user_id === userId);
  if (!current) throw new Error("Set up your provider profile first.");
  const updated = { ...current, name: input.name.trim(), bio: input.bio.trim() || null, service_radius_km: input.radius, updated_at: new Date().toISOString() };
  set("providers", providers.map((p) => p.id === current.id ? updated : p));
  return updated;
}
 async function demo_changePlanStatus(userId: string, planId: string, status: SubscriptionStatus) {
  const family = get<FamilyProfile[]>("families", []).find((f) => f.user_id === userId);
  const plans = get<Subscription[]>("subscriptions", []);
  const plan = plans.find((p) => p.id === planId && p.family_id === family?.id);
  if (!plan) throw new Error("Care plan not found for this account.");
  if (plan.status === "cancelled") throw new Error("A cancelled plan cannot be restarted. Choose a new plan instead.");
  if (!["active", "paused", "cancelled"].includes(status)) throw new Error("Invalid plan status.");
  const updated = { ...plan, status, updated_at: new Date().toISOString() };
  set("subscriptions", plans.map((p) => p.id === planId ? updated : p));
  return updated;
}
 async function demo_rescheduleBooking(userId: string, bookingId: string, scheduledAt: string) {
  const family = get<FamilyProfile[]>("families", []).find((f) => f.user_id === userId);
  const bookings = get<Booking[]>("bookings", []);
  const booking = bookings.find((b) => b.id === bookingId && b.family_id === family?.id);
  if (!booking) throw new Error("Booking not found for this account.");
  if (!["requested", "confirmed"].includes(booking.status) || Date.parse(booking.scheduled_at) <= Date.now()) throw new Error("Only upcoming requested or confirmed visits can be rescheduled.");
  const start = Date.parse(scheduledAt), end = start + booking.duration_hours * 3600000;
  if (!Number.isFinite(start) || start <= Date.now()) throw new Error("Choose a future date and time.");
  if (bookings.some((b) => b.id !== bookingId && b.provider_id === booking.provider_id && ["requested", "confirmed", "in_progress"].includes(b.status) && Date.parse(b.scheduled_at) < end && Date.parse(b.scheduled_at) + b.duration_hours * 3600000 > start)) throw new Error("This time overlaps another visit. Choose a different time.");
  const updated = { ...booking, scheduled_at: new Date(start).toISOString(), updated_at: new Date().toISOString() };
  set("bookings", bookings.map((b) => b.id === bookingId ? updated : b));
  return updated;
}
 async function demo_saveSupportDraft(input: Omit<SupportDraft, "id" | "created_at">) {
  if (!input.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email) || input.message.trim().length < 10 || input.message.length > 2000) throw new Error("Enter your name, a valid email and a message of 10–2,000 characters.");
  const draft = { ...input, id: newId(), created_at: new Date().toISOString() };
  set("supportDrafts", [...get<SupportDraft[]>("supportDrafts", []), draft]);
  return draft;
}
 async function demo_listWorkspaceUsers() {
  const families = get<FamilyProfile[]>("families", []), providers = get<Provider[]>("providers", []);
  const accounts = Object.values(get<Record<string, CurrentUser>>("usersByPhone", {}));
  const profiles = [
    ...families.map((f) => ({ id: f.user_id, name: f.name, role: "family", detail: "Family profile", href: null as string | null })),
    ...providers.map((p) => ({ id: p.user_id, name: p.name, role: "provider", detail: p.verification_status, href: `/admin/providers/${p.id}` })),
  ];
  return [...profiles, ...accounts.filter((a) => !profiles.some((p) => p.id === a.id)).map((a) => ({ id: a.id, name: a.phone, role: a.role, detail: "Profile not completed", href: null as string | null }))];
}

 async function demo_performBookingAction(user: CurrentUser, bookingId: string, action: "accept" | "decline" | "start" | "complete" | "cancel") {
  if (!["admin", "provider"].includes(user.role)) throw new Error("This action is not available for your role.");
  const bookings = get<Booking[]>("bookings", []);
  const booking = bookings.find((b) => b.id === bookingId);
  const provider = get<Provider[]>("providers", []).find((p) => p.id === booking?.provider_id);
  if (!booking || (user.role === "provider" && provider?.user_id !== user.id)) throw new Error("Booking unavailable for this account.");
  if (["start", "complete"].includes(action) && get<Record<string, unknown>>("careVisits", {})[bookingId]) throw new Error("Use Active Care for PIN check-in and family-confirmed check-out.");
  const allowed = { accept: ["requested"], decline: ["requested"], start: ["confirmed"], complete: ["in_progress"], cancel: ["requested", "confirmed"] };
  if (!allowed[action]?.includes(booking.status)) throw new Error("This action is no longer available. Refresh the booking.");
  if (action === "cancel" && user.role !== "admin") throw new Error("Use the booking response actions instead.");
  if (action === "accept" && (provider?.verification_status !== "approved" || (await getPaymentForBooking(booking.id))?.status !== "captured")) throw new Error("An approved provider and a captured demo payment are required before acceptance.");
  const status = ({ accept: "confirmed", decline: "cancelled", start: "in_progress", complete: "completed", cancel: "cancelled" } as const)[action];
  const updated = { ...booking, status, updated_at: new Date().toISOString() };
  set("bookings", bookings.map((b) => b.id === bookingId ? updated : b));
  if (action === "complete") await ensurePayoutForCompletedBooking(updated);
  return updated;
}

// Backend adapters
export const getAvailability: typeof demo_getAvailability = (...args) => backendEnabled ? remote("workspace.getAvailability", args) : demo_getAvailability(...args);
export const saveAvailability: typeof demo_saveAvailability = (...args) => backendEnabled ? remote("workspace.saveAvailability", args) : demo_saveAvailability(...args);
export const updatePublicProfile: typeof demo_updatePublicProfile = (...args) => backendEnabled ? remote("workspace.updatePublicProfile", args) : demo_updatePublicProfile(...args);
export const changePlanStatus: typeof demo_changePlanStatus = (...args) => backendEnabled ? remote("workspace.changePlanStatus", args) : demo_changePlanStatus(...args);
export const rescheduleBooking: typeof demo_rescheduleBooking = (...args) => backendEnabled ? remote("workspace.rescheduleBooking", args) : demo_rescheduleBooking(...args);
export const saveSupportDraft: typeof demo_saveSupportDraft = (...args) => backendEnabled ? remote("workspace.saveSupportDraft", args) : demo_saveSupportDraft(...args);
export const listWorkspaceUsers: typeof demo_listWorkspaceUsers = (...args) => backendEnabled ? remote("workspace.listWorkspaceUsers", args) : demo_listWorkspaceUsers(...args);
export const performBookingAction: typeof demo_performBookingAction = (...args) => backendEnabled ? remote("workspace.performBookingAction", args) : demo_performBookingAction(...args);

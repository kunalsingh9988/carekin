import { get, newId, set } from "../client";
import type { Booking, CurrentUser, FamilyProfile, Provider, CareRecipient, Message, ParentalConsent } from "../types";
import { addNotification } from "./notifications";
import { ensurePayoutForCompletedBooking } from "./payouts";

export type CarePhase = "scheduled" | "arriving" | "active" | "checkout_pending" | "checked_out" | "interrupted";
export type Severity = "emergency" | "urgent" | "service";
export interface CareEvent { id: string; at: string; label: string; actor_role: string }
export interface CareVisit { booking_id: string; phase: CarePhase; checkin_at: string | null; checkout_at: string | null; safe_return_at: string | null; last_safe_at: string | null; contact_restricted: boolean; arrival_pin: string | null; tasks: number[]; timeline: CareEvent[] }
export interface CareBrief { contacts: { name: string; phone: string }[]; access: string; medical: string; needs: string; present: string; share_with_provider: boolean; guardian_acknowledged: boolean; updates: boolean }
export interface SafetyCase { id: string; booking_id: string; reporter_id: string; reporter_role: string; severity: Severity; category: string; narrative: string; status: "new" | "triaged" | "investigating" | "resolved"; owner: string | null; created_at: string; audit: { at: string; actor: string; note: string }[]; evidence: { timeline: CareEvent[]; messages: Message[] } }
export const FAMILY_CONCERNS = ["I feel unsafe / possible abuse", "Care recipient is unwell or injured", "Provider has not arrived / left unexpectedly", "Inappropriate behaviour or harassment", "Medication / care-plan concern", "Property damage or theft concern", "Other concern"];
export const PROVIDER_CONCERNS = ["I feel unsafe in this home", "Threat, harassment, or discrimination", "Someone present is making me uncomfortable", "Care request differs from the booking", "Unsafe home condition", "Care recipient needs urgent medical help", "I cannot continue this visit", "Other concern"];
const URGENT_CONCERNS = new Set([
  "I feel unsafe / possible abuse", "Care recipient is unwell or injured",
  "Provider has not arrived / left unexpectedly", "Inappropriate behaviour or harassment",
  "Medication / care-plan concern", "I feel unsafe in this home",
  "Threat, harassment, or discrimination", "Someone present is making me uncomfortable",
  "Unsafe home condition", "Care recipient needs urgent medical help", "I cannot continue this visit",
]);
export function isUrgentConcern(category: string) { return URGENT_CONCERNS.has(category); }
const readVisits = () => get<Record<string, CareVisit>>("careVisits", {});
const now = () => new Date().toISOString();
const event = (user: CurrentUser, label: string): CareEvent => ({ id: newId(), at: now(), label, actor_role: user.role });
const hasConsent = (recipient: CareRecipient) => get<ParentalConsent[]>("parentalConsents", []).some((c) => c.id === recipient.parental_consent_id && c.care_recipient_id === recipient.id && !c.withdrawn_at);

function participant(user: CurrentUser, id: string) {
  const booking = get<Booking[]>("bookings", []).find((b) => b.id === id);
  const family = get<FamilyProfile[]>("families", []).find((f) => f.id === booking?.family_id);
  const provider = get<Provider[]>("providers", []).find((p) => p.id === booking?.provider_id);
  if (!booking || !family || !provider || !((user.role === "family" && family.user_id === user.id) || (user.role === "provider" && provider.user_id === user.id) || user.role === "admin")) throw new Error("This visit is unavailable for your account.");
  return { booking, family, provider };
}
function visitFor(booking: Booking): CareVisit {
  const stored = readVisits()[booking.id];
  if (stored) return { ...stored, contact_restricted: stored.contact_restricted || booking.status === "disputed", ...(["cancelled", "disputed"].includes(booking.status) ? { phase: "interrupted" as const } : {}) };
  return readVisits()[booking.id] ?? { booking_id: booking.id, phase: booking.status === "in_progress" ? "active" : booking.status === "completed" ? "checked_out" : ["cancelled", "disputed"].includes(booking.status) ? "interrupted" : "scheduled", checkin_at: booking.status === "in_progress" ? booking.updated_at : null, checkout_at: booking.status === "completed" ? booking.updated_at : null, safe_return_at: null, last_safe_at: null, contact_restricted: booking.status === "disputed", arrival_pin: null, tasks: [], timeline: [] };
}
function persist<T>(key: string, value: T) {
  set(key, value);
  if (JSON.stringify(get<T | null>(key, null)) !== JSON.stringify(value)) throw new Error("Could not save on this device. No support team was alerted. Check browser storage and try again; call 112 for immediate danger.");
}
function saveVisit(visit: CareVisit) { persist("careVisits", { ...readVisits(), [visit.booking_id]: visit }); }
export function isContactRestricted(bookingId: string) { return !!readVisits()[bookingId]?.contact_restricted || get<Booking[]>("bookings", []).find((b) => b.id === bookingId)?.status === "disputed"; }
export async function getCareContext(user: CurrentUser, id: string) {
  const { booking, family, provider } = participant(user, id);
  const recipient = get<CareRecipient[]>("careRecipients", []).find((r) => r.id === booking.care_recipient_id);
  const visit = visitFor(booking);
  const terminal = ["checked_out", "interrupted"].includes(visit.phase);
  const active = ["active", "checkout_pending"].includes(visit.phase);
  const shortlyBefore = Date.now() >= Date.parse(booking.scheduled_at) - 2 * 3600000;
  const storedBrief = get<Record<string, CareBrief>>("careBriefs", {})[id] ?? null;
  const canSeeBrief = user.role === "family" || user.role === "admin" || (active && storedBrief?.share_with_provider);
  const { arrival_pin, ...safeVisit } = visit;
  const recipientName = recipient?.name.split(",").at(-1)?.trim().split(" ")[0] || "Care recipient";
  return { booking, visit: { ...safeVisit, arrival_pin: user.role === "family" ? arrival_pin : null, pin_required: !!arrival_pin }, provider: { name: provider.name, type: provider.type, approved: provider.verification_status === "approved" }, familyName: family.name.split(" ")[0], recipientName, recipientType: recipient?.type, address: user.role !== "provider" || (!terminal && (active || shortlyBefore)) ? family.address : null, careNotes: user.role !== "provider" || active ? recipient?.notes ?? null : null, brief: canSeeBrief ? storedBrief : null, myCases: get<SafetyCase[]>("safetyCases", []).filter((c) => c.booking_id === id && c.reporter_id === user.id).map(({ evidence, ...c }) => ({ ...c, preserved_event_count: evidence.timeline.length, preserved_message_count: evidence.messages.length })) };
}
export async function saveCareBrief(user: CurrentUser, id: string, brief: CareBrief) {
  const { booking } = participant(user, id);
  if (user.role !== "family") throw new Error("Only the booking family can edit this brief.");
  const recipient = get<CareRecipient[]>("careRecipients", []).find((r) => r.id === booking.care_recipient_id);
  if (recipient?.type === "child" && brief.share_with_provider && (!brief.guardian_acknowledged || !hasConsent(recipient))) throw new Error("Existing guardian consent and acknowledgement are required before sharing a child’s brief.");
  if (brief.contacts.length > 3 || brief.contacts.some((c) => !c.name.trim() || !/^\+?[\d ()-]{7,20}$/.test(c.phone)) || [brief.access, brief.medical, brief.needs, brief.present].some((s) => s.length > 1000)) throw new Error("Add valid contact details and keep each note under 1,000 characters.");
  persist("careBriefs", { ...get<Record<string, CareBrief>>("careBriefs", {}), [id]: brief });
}
export async function setArrivalPin(user: CurrentUser, id: string, enabled: boolean) {
  const { booking } = participant(user, id); const visit = visitFor(booking);
  if (user.role !== "family" || !["scheduled", "arriving"].includes(visit.phase) || booking.status !== "confirmed") throw new Error("Arrival PIN can only be changed before a confirmed visit starts.");
  visit.arrival_pin = enabled ? String(Math.floor(100000 + Math.random() * 900000)) : null;
  saveVisit(visit);
}
export async function careAction(user: CurrentUser, id: string, action: "arriving" | "checkin" | "safe" | "checkout" | "confirm_checkout" | "safe_return" | "task", input = "") {
  const { booking, provider, family } = participant(user, id); const visit = visitFor(booking);
  if (!["family", "provider"].includes(user.role)) throw new Error("Use the participant view for visit actions.");
  const isProvider = user.role === "provider";
  if (visit.contact_restricted && ["arriving", "checkin", "task"].includes(action)) throw new Error("This visit requires operations review. Do not start or continue care; safety and departure actions remain available.");
  if (action === "safe_return") {
    if (!isProvider || !["checkout_pending", "checked_out", "interrupted"].includes(visit.phase)) throw new Error("Safe-return confirmation is available after requesting check-out or interrupting a visit.");
    visit.safe_return_at = now(); visit.timeline.push(event(user, "Provider safe return confirmed"));
  } else {
    if (["checked_out", "interrupted"].includes(visit.phase)) throw new Error("This visit has ended.");
    if (action === "arriving") { if (!isProvider || booking.status !== "confirmed" || visit.phase !== "scheduled") throw new Error("Arrival is unavailable in this state."); visit.phase = "arriving"; visit.timeline.push(event(user, "Provider marked on the way")); }
    if (action === "checkin") {
      if (!isProvider || booking.status !== "confirmed" || !provider || provider.verification_status !== "approved" || !["scheduled", "arriving"].includes(visit.phase)) throw new Error("Only the assigned approved provider can check into a confirmed visit.");
      if (visit.arrival_pin && input !== visit.arrival_pin) throw new Error("The arrival PIN does not match. Ask the booking family to confirm it.");
      const recipient = get<CareRecipient[]>("careRecipients", []).find((r) => r.id === booking.care_recipient_id);
      if (recipient?.type === "child" && !hasConsent(recipient)) throw new Error("Guardian consent is required before this visit starts.");
      visit.phase = "active"; visit.checkin_at = now(); visit.last_safe_at = visit.checkin_at; visit.timeline.push(event(user, "Check-in confirmed · care started"));
      set("bookings", get<Booking[]>("bookings", []).map((b) => b.id === id ? { ...b, status: "in_progress", updated_at: now() } : b));
      if (get<Record<string, CareBrief>>("careBriefs", {})[id]?.updates !== false) await addNotification(family.user_id, "booking_confirmed", "Demo care visit checked in. Open Active Care for the timeline.");
    }
    if (action === "safe" || action === "task") { if (!isProvider || visit.phase !== "active") throw new Error("This action requires an active visit."); if (action === "safe") { visit.last_safe_at = now(); visit.timeline.push(event(user, "Provider safety check-in recorded")); } else { const task = Number(input); if (![0, 1, 2].includes(task)) throw new Error("Unknown care checklist item."); visit.tasks = visit.tasks.includes(task) ? visit.tasks.filter((n) => n !== task) : [...visit.tasks, task]; visit.timeline.push(event(user, "Care checklist updated")); } }
    if (action === "checkout") { if (!isProvider || visit.phase !== "active") throw new Error("Only the active provider can request check-out."); visit.phase = "checkout_pending"; visit.timeline.push(event(user, "Provider requested check-out")); if (get<Record<string, CareBrief>>("careBriefs", {})[id]?.updates !== false) await addNotification(family.user_id, "booking_confirmed", "Demo provider requested check-out. Review the visit in Active Care."); }
    if (action === "confirm_checkout") { if (isProvider || visit.phase !== "checkout_pending") throw new Error("The booking family must confirm check-out."); visit.phase = "checked_out"; visit.checkout_at = now(); visit.timeline.push(event(user, "Family confirmed check-out")); const completed: Booking = { ...booking, status: "completed", updated_at: now() }; set("bookings", get<Booking[]>("bookings", []).map((b) => b.id === id ? completed : b)); await ensurePayoutForCompletedBooking(completed); await addNotification(provider.user_id, "booking_confirmed", "Demo care visit check-out confirmed."); }
  }
  saveVisit(visit);
}
export async function reportSafetyConcern(user: CurrentUser, id: string, input: { category: string; severity: Severity; narrative: string; interrupt?: boolean }) {
  const { booking } = participant(user, id);
  if (!["family", "provider"].includes(user.role)) throw new Error("Only participants can submit a concern.");
  if (!["emergency", "urgent", "service"].includes(input.severity) || !input.category.trim() || input.category.length > 150 || input.narrative.length > 2000) throw new Error("Choose a concern and keep the description under 2,000 characters.");
  const visit = visitFor(booking);
  const severity = input.severity === "service" && isUrgentConcern(input.category) ? "urgent" : input.severity;
  const sensitive = severity !== "service" || !!input.interrupt;
  if (input.interrupt && ["checked_out", "interrupted"].includes(visit.phase)) throw new Error("This visit has already ended. You can still report a concern.");
  if (sensitive) visit.contact_restricted = true;
  if (input.interrupt) { visit.phase = "interrupted"; visit.checkout_at = now(); visit.timeline.push(event(user, "Visit interrupted · operations review required")); set("bookings", get<Booking[]>("bookings", []).map((b) => b.id === id ? { ...b, status: "disputed", updated_at: now() } : b)); }
  const created: SafetyCase = { id: newId(), booking_id: id, reporter_id: user.id, reporter_role: user.role, severity, category: input.category, narrative: input.narrative.trim(), status: "new", owner: null, created_at: now(), audit: [{ at: now(), actor: user.id, note: "Demo case recorded; no emergency or support service alerted" }], evidence: { timeline: [...visit.timeline], messages: get<Message[]>("messages", []).filter((m) => m.booking_id === id).map((m) => ({ ...m })) } };
  saveVisit(visit); persist("safetyCases", [created, ...get<SafetyCase[]>("safetyCases", [])]);
  return created;
}
export async function listSafetyCases(user: CurrentUser) { if (user.role !== "admin") throw new Error("Admin view required."); return get<SafetyCase[]>("safetyCases", []); }
export async function updateSafetyCase(user: CurrentUser, id: string, status: SafetyCase["status"], note: string) {
  if (user.role !== "admin" || !["new", "triaged", "investigating", "resolved"].includes(status) || !note.trim() || note.length > 1000) throw new Error("Admin access and a case note of 1–1,000 characters are required.");
  const cases = get<SafetyCase[]>("safetyCases", []); const current = cases.find((c) => c.id === id);
  if (!current) throw new Error("Case not found.");
  const updated = { ...current, status, owner: user.id, audit: [...current.audit, { at: now(), actor: user.id, note: note.trim() }] };
  persist("safetyCases", cases.map((c) => c.id === id ? updated : c));
  // Resolution never automatically re-enables contact, changes account access or moves money.
}
export async function getSafeReturnFollowups(user: CurrentUser) {
  if (user.role !== "admin") throw new Error("Admin view required.");
  return get<Booking[]>("bookings", []).map((booking) => ({ booking, visit: visitFor(booking) })).filter(({ booking, visit }) => visit.checkin_at && !visit.safe_return_at && Date.now() > Date.parse(booking.scheduled_at) + booking.duration_hours * 3600000 && ["active", "checkout_pending", "checked_out", "interrupted"].includes(visit.phase));
}

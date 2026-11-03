import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearLocalStorage, installLocalStorageMock } from "../storage-mock";
import { get, set } from "../client";
import type { Booking, CareRecipient, CurrentUser, FamilyProfile, Provider } from "../types";
import { careAction, getCareContext, getSafeReturnFollowups, isUrgentConcern, listSafetyCases, reportSafetyConcern, saveCareBrief, setArrivalPin, updateSafetyCase, type CareBrief } from "./care";
import { listMessages, sendMessage } from "./messages";
import { performBookingAction } from "./workspace";

installLocalStorageMock();
const family: CurrentUser = { id: "family1", role: "family", phone: "", created_at: "" };
const providerUser: CurrentUser = { ...family, id: "provider1", role: "provider" };
const admin: CurrentUser = { ...family, id: "admin1", role: "admin" };
const provider: Provider = { id: "p1", user_id: "provider1", type: "caregiver", name: "Demo Provider", phone: "+910000000002", bio: null, service_radius_km: 5, latitude: 0, longitude: 0, verification_status: "approved", photo_seed: "demo", created_at: "", updated_at: "" };
const recipient: CareRecipient = { id: "r1", family_id: "f1", name: "Demo Elder", type: "elder", notes: "Fictional care note", parental_consent_id: null, created_at: "", updated_at: "" };
const booking: Booking = { id: "b1", family_id: "f1", provider_id: "p1", care_recipient_id: "r1", type: "one_off", status: "confirmed", scheduled_at: new Date(Date.now() + 86400000).toISOString(), duration_hours: 2, amount_paise: 120000, commission_paise: 21600, subscription_id: null, created_at: "", updated_at: "" };
const brief: CareBrief = { contacts: [{ name: "Fictional contact", phone: "0000000000" }], access: "Demo instructions", medical: "Fictional allergy", needs: "Fictional mobility note", present: "Demo adult", share_with_provider: true, guardian_acknowledged: false, updates: true };
beforeEach(() => {
  clearLocalStorage();
  set("families", [{ id: "f1", user_id: "family1", name: "Demo Family", address: "Fictional test address" } as FamilyProfile]);
  set("providers", [provider]); set("careRecipients", [recipient]); set("bookings", [booking]);
});
describe("Active Care local prototype", () => {
  it("scopes participant views and hides provider PIN, address and notes before the window", async () => {
    await expect(getCareContext({ ...family, id: "other" }, "b1")).rejects.toThrow("unavailable");
    await setArrivalPin(family, "b1", true);
    const own = await getCareContext(family, "b1"), other = await getCareContext(providerUser, "b1");
    expect(own.visit.arrival_pin).toMatch(/^\d{6}$/);
    expect(other.visit.arrival_pin).toBeNull(); expect(other.visit.pin_required).toBe(true);
    expect(other.address).toBeNull(); expect(other.careNotes).toBeNull();
    await expect(setArrivalPin(providerUser, "b1", false)).rejects.toThrow();
  });
  it("enforces PIN and provider approval, records timer/checklist, and blocks legacy bypass", async () => {
    await setArrivalPin(family, "b1", true);
    const pin = (await getCareContext(family, "b1")).visit.arrival_pin!;
    await expect(performBookingAction(providerUser, "b1", "start")).rejects.toThrow("Active Care");
    await expect(careAction(family, "b1", "checkin", pin)).rejects.toThrow();
    await expect(careAction(providerUser, "b1", "checkin", "wrong")).rejects.toThrow("PIN");
    set("providers", [{ ...provider, verification_status: "pending" }]);
    await expect(careAction(providerUser, "b1", "checkin", pin)).rejects.toThrow("approved");
    set("providers", [provider]);
    await careAction(providerUser, "b1", "arriving"); await careAction(providerUser, "b1", "checkin", pin);
    await careAction(providerUser, "b1", "safe"); await careAction(providerUser, "b1", "task", "0");
    const context = await getCareContext(providerUser, "b1");
    expect(context.visit.phase).toBe("active"); expect(context.visit.checkin_at).toBeTruthy();
    expect(context.visit.tasks).toEqual([0]); expect(context.visit.timeline).toHaveLength(4);
    expect(context.careNotes).toBe(recipient.notes);
    await expect(careAction(providerUser, "b1", "safe_return")).rejects.toThrow();
  });
  it("requires current guardian consent for child check-in and sharing", async () => {
    set("careRecipients", [{ ...recipient, type: "child", parental_consent_id: "consent1" }]);
    await expect(careAction(providerUser, "b1", "checkin")).rejects.toThrow("Guardian consent");
    await expect(saveCareBrief(family, "b1", { ...brief, guardian_acknowledged: true })).rejects.toThrow("consent");
    set("parentalConsents", [{ id: "consent1", care_recipient_id: "r1", withdrawn_at: null }]);
    await expect(saveCareBrief(family, "b1", brief)).rejects.toThrow("acknowledgement");
    await saveCareBrief(family, "b1", { ...brief, guardian_acknowledged: true });
    set("parentalConsents", [{ id: "consent1", care_recipient_id: "r1", withdrawn_at: new Date().toISOString() }]);
    await expect(careAction(providerUser, "b1", "checkin")).rejects.toThrow("Guardian consent");
  });
  it("shares authorized briefs only during care and respects local updates preference", async () => {
    await saveCareBrief(family, "b1", { ...brief, updates: false });
    expect((await getCareContext(providerUser, "b1")).brief).toBeNull();
    await expect(saveCareBrief(providerUser, "b1", brief)).rejects.toThrow();
    await careAction(providerUser, "b1", "checkin");
    expect((await getCareContext(providerUser, "b1")).brief?.medical).toBe(brief.medical);
    await careAction(providerUser, "b1", "checkout");
    expect(get<unknown[]>("notifications", [])).toHaveLength(0);
    await careAction(family, "b1", "confirm_checkout");
    const ended = await getCareContext(providerUser, "b1");
    expect(ended.address).toBeNull(); expect(ended.brief).toBeNull(); expect(ended.careNotes).toBeNull();
  });
  it("requires family checkout confirmation, creates one demo payout and allows independent safe return", async () => {
    await careAction(providerUser, "b1", "checkin");
    await careAction(providerUser, "b1", "checkout");
    await expect(careAction(providerUser, "b1", "confirm_checkout")).rejects.toThrow("family");
    await careAction(providerUser, "b1", "safe_return");
    expect((await getCareContext(family, "b1")).visit.phase).toBe("checkout_pending");
    await careAction(family, "b1", "confirm_checkout");
    expect(get<Booking[]>("bookings", [])[0].status).toBe("completed");
    expect(get<unknown[]>("payouts", [])).toHaveLength(1);
    await expect(careAction(family, "b1", "confirm_checkout")).rejects.toThrow("ended");
  });
  it("allows either participant to interrupt without permission and never moves money", async () => {
    const saved = await reportSafetyConcern(providerUser, "b1", { category: "I cannot continue", narrative: "Fictional safety scenario", severity: "urgent", interrupt: true });
    expect(saved.status).toBe("new");
    expect((await getCareContext(family, "b1")).visit.phase).toBe("interrupted");
    expect(get<Booking[]>("bookings", [])[0].status).toBe("disputed");
    expect(get<unknown[]>("payouts", [])).toHaveLength(0);
    await careAction(providerUser, "b1", "safe_return");
    expect((await getCareContext(providerUser, "b1")).visit.safe_return_at).toBeTruthy();
    await expect(careAction(providerUser, "b1", "checkin")).rejects.toThrow();
    await expect(reportSafetyConcern(family, "b1", { category: "End early", severity: "urgent", narrative: "", interrupt: true })).rejects.toThrow("ended");
  });
  it("keeps sensitive reports private, preserves messages and blocks stale send/read attempts", async () => {
    await sendMessage("b1", family.id, "family", "Fictional evidence");
    const saved = await reportSafetyConcern(family, "b1", { category: "I feel unsafe / possible abuse", severity: "service", narrative: "Private fictional report" });
    expect(saved.severity).toBe("urgent");
    expect((await getCareContext(providerUser, "b1")).myCases).toHaveLength(0);
    const own = (await getCareContext(family, "b1")).myCases[0];
    expect(own.preserved_message_count).toBe(1); expect(own).not.toHaveProperty("evidence");
    await expect(sendMessage("b1", providerUser.id, "provider", "Blocked")).rejects.toThrow("restricted");
    await expect(listMessages("b1")).rejects.toThrow("restricted");
    await expect(careAction(providerUser, "b1", "checkin")).rejects.toThrow("review");
    await expect(listSafetyCases(providerUser)).rejects.toThrow("Admin");
    await updateSafetyCase(admin, saved.id, "resolved", "Demo review only; no outside action taken.");
    expect((await listSafetyCases(admin))[0].audit).toHaveLength(2);
    expect((await listSafetyCases(admin))[0].owner).toBe(admin.id);
    await expect(listMessages("b1")).rejects.toThrow("restricted");
    expect((await listSafetyCases(admin))[0].evidence.messages[0].content).toBe("Fictional evidence");
  });
  it("keeps ordinary service reports from automatically restricting chat", async () => {
    await reportSafetyConcern(providerUser, "b1", { category: "Care request differs from the booking", severity: "service", narrative: "" });
    await expect(sendMessage("b1", family.id, "family", "Fictional follow-up")).resolves.toBeTruthy();
    await expect(updateSafetyCase(family, "bad", "resolved", "note")).rejects.toThrow("Admin");
    await expect(updateSafetyCase(admin, "bad", "resolved", "")).rejects.toThrow("note");
  });
  it("treats unexpected provider departure as urgent in shared UI and repository classification", async () => {
    const category = "Provider has not arrived / left unexpectedly";
    expect(isUrgentConcern(category)).toBe(true);
    const saved = await reportSafetyConcern(family, "b1", { category, severity: "service", narrative: "Fictional departure scenario" });
    expect(saved.severity).toBe("urgent");
    expect((await getCareContext(family, "b1")).visit.contact_restricted).toBe(true);
    await expect(sendMessage("b1", providerUser.id, "provider", "Blocked")).rejects.toThrow("restricted");
  });
  it("computes admin-only overdue follow-ups and clears them on safe return", async () => {
    set("bookings", [{ ...booking, scheduled_at: new Date(Date.now() - 86400000).toISOString() }]);
    await careAction(providerUser, "b1", "checkin");
    await expect(getSafeReturnFollowups(family)).rejects.toThrow("Admin");
    expect(await getSafeReturnFollowups(admin)).toHaveLength(1);
    await careAction(providerUser, "b1", "checkout"); await careAction(providerUser, "b1", "safe_return");
    expect(await getSafeReturnFollowups(admin)).toHaveLength(0);
  });
  it("does not claim to save a report when storage fails", async () => {
    const blocked = vi.spyOn(window.localStorage, "setItem").mockImplementation(() => { throw new Error("Storage unavailable"); });
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
    await expect(reportSafetyConcern(family, "b1", { category: "Other concern", severity: "service", narrative: "" })).rejects.toThrow("Could not save");
    blocked.mockRestore(); warning.mockRestore();
    expect(await listSafetyCases(admin)).toHaveLength(0);
  });
});

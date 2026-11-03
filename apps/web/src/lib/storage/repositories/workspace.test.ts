import { beforeEach, describe, expect, it } from "vitest";
import { clearLocalStorage, installLocalStorageMock } from "../storage-mock";
import { get, set } from "../client";
import type { Booking, Provider, Subscription } from "../types";
import { changePlanStatus, rescheduleBooking, saveAvailability, getAvailability, saveSupportDraft, updatePublicProfile, performBookingAction } from "./workspace";

installLocalStorageMock();
const future = (days: number) => new Date(Date.now() + days * 86400000).toISOString();
const provider: Provider = { id: "p1", user_id: "provider1", type: "caregiver", name: "Demo Provider", phone: "+910000000002", bio: null, service_radius_km: 5, latitude: 0, longitude: 0, verification_status: "approved", photo_seed: "demo", created_at: future(-1), updated_at: future(-1) };
const booking: Booking = { id: "b1", family_id: "f1", provider_id: "p1", care_recipient_id: "r1", type: "one_off", status: "confirmed", scheduled_at: future(1), duration_hours: 2, amount_paise: 120000, commission_paise: 21600, subscription_id: null, created_at: future(-1), updated_at: future(-1) };
beforeEach(() => {
  clearLocalStorage();
  set("providers", [provider]); set("families", [{ id: "f1", user_id: "family1" }]); set("bookings", [booking]);
});
describe("workspace workflows", () => {
  it("saves seven-day hours and rejects invalid windows or another provider", async () => {
    const days = await getAvailability("p1");
    days[1] = { day: 1, enabled: true, start: "09:00", end: "17:00" };
    await saveAvailability("provider1", "p1", days);
    expect((await getAvailability("p1"))[1].enabled).toBe(true);
    await expect(saveAvailability("other", "p1", days)).rejects.toThrow("not yours");
    days[1].end = "08:00";
    await expect(saveAvailability("provider1", "p1", days)).rejects.toThrow("end time");
  });
  it("keeps approval and private fields unchanged when editing a public profile", async () => {
    const updated = await updatePublicProfile("provider1", { name: "Updated Demo", bio: "Care experience", radius: 8 });
    expect(updated.verification_status).toBe("approved"); expect(updated.phone).toBe(provider.phone);
    expect(updated.name).toBe("Updated Demo");
    await expect(updatePublicProfile("provider1", { name: "", bio: "", radius: 0 })).rejects.toThrow();
  });
  it("reschedules only owned future visits and preserves the recorded price", async () => {
    await expect(rescheduleBooking("other", "b1", future(3))).rejects.toThrow("not found");
    await expect(rescheduleBooking("family1", "b1", future(-1))).rejects.toThrow("future");
    const updated = await rescheduleBooking("family1", "b1", future(3));
    expect(updated.amount_paise).toBe(booking.amount_paise);
    set("bookings", [{ ...booking, status: "completed" }]);
    await expect(rescheduleBooking("family1", "b1", future(4))).rejects.toThrow("Only upcoming");
  });
  it("blocks overlapping visits but permits adjacent times", async () => {
    set("bookings", [booking, { ...booking, id: "b2", family_id: "f2", scheduled_at: future(3) }]);
    await expect(rescheduleBooking("family1", "b1", future(3))).rejects.toThrow("overlaps");
    await expect(rescheduleBooking("family1", "b1", new Date(Date.parse(future(3)) + 3 * 3600000).toISOString())).resolves.toMatchObject({ id: "b1" });
  });
  it("scopes plan changes and cannot reactivate cancelled plans", async () => {
    const plan = { id: "s1", family_id: "f1", status: "active" } as Subscription;
    set("subscriptions", [plan]);
    await expect(changePlanStatus("other", "s1", "paused")).rejects.toThrow("not found");
    expect((await changePlanStatus("family1", "s1", "paused")).status).toBe("paused");
    await changePlanStatus("family1", "s1", "cancelled");
    await expect(changePlanStatus("family1", "s1", "active")).rejects.toThrow("cannot be restarted");
    expect(get<Booking[]>("bookings", [])[0].status).toBe("confirmed");
  });
  it("validates and persists support drafts without pretending to send them", async () => {
    await expect(saveSupportDraft({ name: "Demo", email: "bad", topic: "Booking", message: "hello" })).rejects.toThrow();
    const draft = await saveSupportDraft({ name: "Demo", email: "demo@example.test", topic: "Booking", message: "A fictional support question." });
    expect(get<{ id: string }[]>("supportDrafts", [])[0].id).toBe(draft.id);
  });
  it("checks ownership, payment and valid booking transitions", async () => {
    const user = { id: "provider1", role: "provider" as const, phone: "", created_at: "" };
    await expect(performBookingAction({ ...user, id: "other" }, "b1", "start")).rejects.toThrow("unavailable");
    await expect(performBookingAction(user, "b1", "complete")).rejects.toThrow("no longer available");
    await performBookingAction(user, "b1", "start");
    await performBookingAction(user, "b1", "complete");
    expect(get<Booking[]>("bookings", [])[0].status).toBe("completed");
    expect(get<unknown[]>("payouts", [])).toHaveLength(1);
    set("bookings", [{ ...booking, status: "requested" }]);
    await expect(performBookingAction(user, "b1", "accept")).rejects.toThrow("captured demo payment");
  });
});

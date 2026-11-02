import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { clearLocalStorage, installLocalStorageMock } from "../storage-mock";
import { DEFAULT_COMMISSION_RATE } from "../../business";

installLocalStorageMock();

import {
  createBooking,
  getBooking,
  linkBookingToSubscription,
  listBookingsForFamily,
  listBookingsForProvider,
  updateBookingStatus,
} from "./bookings";
import { cancelSubscription, createSubscription, getSubscription, listSubscriptionsForFamily } from "./subscriptions";

const INPUT = {
  familyId: "fam-1",
  providerId: "prov-1",
  careRecipientId: "rec-1",
  type: "one_off" as const,
  scheduledAt: "2026-08-10T10:00:00.000Z",
  durationHours: 2,
  amountPaise: 120000,
};

describe("bookings repository", () => {
  beforeAll(installLocalStorageMock);
  beforeEach(clearLocalStorage);

  it("creates a booking in requested status with 18% commission recorded", async () => {
    const booking = await createBooking(INPUT);
    expect(booking.status).toBe("requested");
    expect(booking.commission_paise).toBe(Math.round(INPUT.amountPaise * DEFAULT_COMMISSION_RATE));
    expect(booking.subscription_id).toBeNull();
  });

  it("scopes listings to the owning family and provider", async () => {
    await createBooking(INPUT);
    await createBooking({ ...INPUT, familyId: "fam-2", providerId: "prov-2" });

    expect(await listBookingsForFamily("fam-1")).toHaveLength(1);
    expect(await listBookingsForFamily("fam-2")).toHaveLength(1);
    expect(await listBookingsForFamily("fam-3")).toHaveLength(0);
    expect(await listBookingsForProvider("prov-1")).toHaveLength(1);
    expect(await listBookingsForProvider("prov-2")).toHaveLength(1);
  });

  it("moves a booking through the lifecycle and preserves identity", async () => {
    const booking = await createBooking(INPUT);
    const confirmed = await updateBookingStatus(booking.id, "confirmed");
    expect(confirmed.id).toBe(booking.id);
    expect(confirmed.status).toBe("confirmed");

    const completed = await updateBookingStatus(booking.id, "completed");
    expect(completed.status).toBe("completed");
    expect((await getBooking(booking.id))?.status).toBe("completed");
  });

  it("does not duplicate a booking on update — one row per booking id", async () => {
    const booking = await createBooking(INPUT);
    await updateBookingStatus(booking.id, "confirmed");
    await updateBookingStatus(booking.id, "cancelled");
    expect(await listBookingsForFamily("fam-1")).toHaveLength(1);
  });

  it("throws when updating a nonexistent booking", async () => {
    await expect(updateBookingStatus("nope", "confirmed")).rejects.toThrow(/not found/);
  });

  it("links a booking to a subscription record", async () => {
    const sub = await createSubscription({
      familyId: INPUT.familyId,
      providerId: INPUT.providerId,
      frequency: "weekly",
      amountPaise: INPUT.amountPaise,
      nextBillingDate: "2026-08-17T10:00:00.000Z",
    });
    const booking = await createBooking({ ...INPUT, type: "subscription" });
    const linked = await linkBookingToSubscription(booking.id, sub.id);

    expect(linked.subscription_id).toBe(sub.id);
    expect((await getSubscription(sub.id))?.status).toBe("active");
    expect(await listSubscriptionsForFamily(INPUT.familyId)).toHaveLength(1);

    const cancelled = await cancelSubscription(sub.id);
    expect(cancelled.status).toBe("cancelled");
  });
});

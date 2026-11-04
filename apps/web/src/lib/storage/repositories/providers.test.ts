import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { clearLocalStorage, installLocalStorageMock } from "../storage-mock";

installLocalStorageMock();

import { approveProvider } from "./admin";
import {
  createProviderProfile,
  getProviderPublic,
  getVerificationStatus,
  listApprovedProviders,
} from "./providers";

const CENTER = { latitude: 28.6, longitude: 77.2 };

function makeProviderInput(overrides: Partial<Parameters<typeof createProviderProfile>[1]> = {}) {
  return {
    type: "caregiver" as const,
    name: "Test Provider",
    phone: "+919999999999",
    serviceRadiusKm: 10,
    ...CENTER,
    ...overrides,
  };
}

describe("providers repository", () => {
  beforeAll(installLocalStorageMock);
  beforeEach(clearLocalStorage);

  it("hides pending providers from public listing and profile lookups", async () => {
    const provider = await createProviderProfile("user-1", makeProviderInput());
    expect(provider.verification_status).toBe("pending");

    const listed = await listApprovedProviders({ type: "caregiver", ...CENTER });
    expect(listed).toHaveLength(0);
    expect(await getProviderPublic(provider.id)).toBeNull();
  });

  it("returns approved providers and strips phone/coordinates for guests", async () => {
    const provider = await createProviderProfile("user-1", makeProviderInput());
    await approveProvider(provider.id, "admin-1");

    const listed = await listApprovedProviders({ type: "caregiver", ...CENTER });
    expect(listed).toHaveLength(1);
    const guest = listed[0];
    expect(guest.id).toBe(provider.id);
    expect("phone" in guest).toBe(false);
    expect("latitude" in guest).toBe(false);
    expect("longitude" in guest).toBe(false);
    expect(guest.distance_km).toBeGreaterThanOrEqual(0);

    const pub = await getProviderPublic(provider.id);
    expect(pub).not.toBeNull();
    expect("phone" in pub!).toBe(false);
    expect("latitude" in pub!).toBe(false);
    expect("longitude" in pub!).toBe(false);
  });

  it("filters by provider type and radius", async () => {
    const caregiver = await createProviderProfile("u1", makeProviderInput({ name: "Carer" }));
    const sitter = await createProviderProfile("u2", makeProviderInput({ name: "Sitter", type: "babysitter" }));
    const farAway = await createProviderProfile("u3", makeProviderInput({ name: "Far", latitude: 19.0, longitude: 72.8 }));
    await approveProvider(caregiver.id, "admin-1");
    await approveProvider(sitter.id, "admin-1");
    await approveProvider(farAway.id, "admin-1");

    const caregivers = await listApprovedProviders({ type: "caregiver", ...CENTER, radiusKm: 15 });
    expect(caregivers.map((p) => p.name)).toEqual(["Carer"]);

    const sitters = await listApprovedProviders({ type: "babysitter", ...CENTER, radiusKm: 15 });
    expect(sitters.map((p) => p.name)).toEqual(["Sitter"]);
  });

  it("records a verification trail entry on application", async () => {
    const provider = await createProviderProfile("user-1", makeProviderInput());
    const { status, reviews } = await getVerificationStatus(provider.id);
    expect(status).toBe("pending");
    expect(reviews).toHaveLength(1);
    expect(reviews[0].to_status).toBe("pending");
    expect(reviews[0].from_status).toBeNull();
  });

  it("supports development discovery across continents without exposing pending profiles or private fields", async () => {
    const approved = await createProviderProfile("worldwide", makeProviderInput({ name: "Distant provider", latitude: -33.8688, longitude: 151.2093 }));
    const antipodal = await createProviderProfile("opposite-side", makeProviderInput({ name: "Antipodal provider", latitude: -CENTER.latitude, longitude: CENTER.longitude - 180 }));
    await createProviderProfile("pending-worldwide", makeProviderInput({ latitude: 40.7128, longitude: -74.006 }));
    await approveProvider(approved.id, "admin-1");
    await approveProvider(antipodal.id, "admin-1");
    const result = await listApprovedProviders({ type: "caregiver", ...CENTER, radiusKm: 20040 });
    expect(result.map(provider => provider.id)).toEqual([approved.id, antipodal.id]);
    expect(result[1].distance_km).toBeLessThan(20040);
    expect(result[0].distance_km).toBeGreaterThan(1000);
    expect(result[0]).not.toHaveProperty("phone");
    expect(result[0]).not.toHaveProperty("latitude");
  });
});

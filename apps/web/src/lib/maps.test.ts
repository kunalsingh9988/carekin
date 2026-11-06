import { describe, expect, it, vi, afterEach } from "vitest";
import { confirmedAddress, parseAddressPlaces } from "./maps";

const sample = { place_id: "public-place", lat: 12.9716, lon: 77.5946, formatted: "MG Road, Bengaluru, India", address_line1: "MG Road", address_line2: "Bengaluru, India" };
describe("address selection", () => {
  it("projects valid results into the address picker model", () => {
    expect(parseAddressPlaces({ results: [sample] })[0]).toEqual({ id: "public-place", latitude: 12.9716, longitude: 77.5946, formatted: sample.formatted, line1: "MG Road", line2: "Bengaluru, India" });
  });
  it("rejects malformed results, missing addresses and out-of-range coordinates", () => {
    expect(parseAddressPlaces(null)).toEqual([]);
    expect(parseAddressPlaces({ results: [null, { ...sample, lat: 100 }, { ...sample, lon: -190 }, { ...sample, lat: null }, { lat: 1, lon: 2 }] })).toEqual([]);
  });
  it("limits response size and never exposes arbitrary provider fields", () => {
    const places = parseAddressPlaces({ results: Array.from({ length: 9 }, () => ({ ...sample, private_data: "not projected" })) });
    expect(places).toHaveLength(5); expect(places[0]).not.toHaveProperty("private_data");
  });
  it("combines separately entered flat and landmark only at confirmation", () => {
    const place = parseAddressPlaces({ results: [sample] })[0];
    expect(confirmedAddress(place, "  Flat 4B ", " Metro gate ")).toBe("Flat 4B, MG Road, Bengaluru, India, Near Metro gate");
    expect(confirmedAddress(place, "", "")).toBe(sample.formatted);
  });
});

describe("Geoapify client requests", () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.resetModules(); });
  it("keeps a user-selected pin instead of snapping to a nearby building", async () => {
    vi.stubEnv("NEXT_PUBLIC_GEOAPIFY_API_KEY", "synthetic-unit-test-key"); vi.resetModules();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ results: [sample] }) });
    vi.stubGlobal("fetch", fetchMock);
    const { reverseAddress } = await import("./maps");
    const result = await reverseAddress({ latitude: 12.97, longitude: 77.59 }, new AbortController().signal);
    expect(result.latitude).toBe(12.97); expect(result.longitude).toBe(77.59);
    expect(String(fetchMock.mock.calls[0][0])).toBe("/api/maps/address");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).kind).toBe("reverse");
  });
  it("reports quota failure without reflecting raw provider bodies or keys", async () => {
    vi.stubEnv("NEXT_PUBLIC_GEOAPIFY_API_KEY", "synthetic-unit-test-key"); vi.resetModules();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 429 }));
    const { searchAddresses } = await import("./maps");
    await expect(searchAddresses("Bengaluru", new AbortController().signal)).rejects.toThrow("Wait a moment");
  });
  it("does not fabricate an address when the server provider is unavailable", async () => {
    vi.resetModules();
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 503 }); vi.stubGlobal("fetch", fetchMock);
    const { searchAddresses } = await import("./maps");
    await expect(searchAddresses("Bengaluru", new AbortController().signal)).rejects.toThrow("couldn’t look up");
  });
});

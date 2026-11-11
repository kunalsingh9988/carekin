import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocked = vi.hoisted(() => ({ enabled: true, allowed: true, fetch: vi.fn(), fallback: vi.fn(), normalize: vi.fn((p: unknown) => ({ results: Array.isArray(p) ? p : [] })) }));
vi.mock("@/lib/maps-server", () => ({ mapsEnabled: () => mocked.enabled, allowMapRequest: () => mocked.allowed, sameMapOrigin: (request: Request) => request.headers.get("origin") === new URL(request.url).origin, providerMapFetch: mocked.fetch, nominatimFetch: mocked.fallback, normalizeNominatim: mocked.normalize }));
import { POST } from "./route";
function request(body: unknown, origin = "https://carekin-web.vercel.app") { return new Request("https://carekin-web.vercel.app/api/maps/address", { method: "POST", headers: { origin, "Content-Type": "application/json" }, body: JSON.stringify(body) }); }
describe("server-side map address gateway", () => {
  beforeEach(() => { mocked.enabled = true; mocked.allowed = true; mocked.fetch.mockReset(); mocked.fallback.mockReset(); mocked.normalize.mockClear(); });
  afterEach(() => vi.restoreAllMocks());
  it("rejects cross-origin requests before using the provider", async () => {
    expect((await POST(request({ kind: "autocomplete", text: "Bengaluru" }, "https://other.test"))).status).toBe(403);
    expect(mocked.fetch).not.toHaveBeenCalled();
  });
  it("rejects invalid coordinates and short search input", async () => {
    expect((await POST(request({ kind: "reverse", latitude: 91, longitude: 0 }))).status).toBe(400);
    expect((await POST(request({ kind: "autocomplete", text: "a" }))).status).toBe(400);
    expect(mocked.fetch).not.toHaveBeenCalled();
  });
  it("uses only approved paths and parameters for provider calls", async () => {
    mocked.fetch.mockResolvedValue({ ok: true, json: async () => ({ results: [] }) });
    expect((await POST(request({ kind: "reverse", latitude: 12.97, longitude: 77.59 }))).status).toBe(200);
    expect(mocked.fetch.mock.calls[0][1]).toBe("/v1/geocode/reverse");
    expect(mocked.fetch.mock.calls[0][2]).toMatchObject({ lat: "12.97", lon: "77.59" });
    expect(mocked.fallback).not.toHaveBeenCalled();
  });
  it("falls back to Nominatim when the provider key is missing or rejected", async () => {
    mocked.fetch.mockResolvedValue({ ok: false, status: 401 });
    mocked.fallback.mockResolvedValue({ ok: true, json: async () => [] });
    expect((await POST(request({ kind: "autocomplete", text: "Bengaluru" }))).status).toBe(200);
    expect(mocked.fallback.mock.calls[0][0]).toBe("/search");
    mocked.enabled = false;
    expect((await POST(request({ kind: "reverse", latitude: 12.97, longitude: 77.59 }))).status).toBe(200);
    expect(mocked.fallback.mock.calls[1][0]).toBe("/reverse");
  });
  it("does not reflect raw provider failures or credentials", async () => {
    mocked.fetch.mockRejectedValue(new Error("sensitive-provider-diagnostic"));
    mocked.fallback.mockRejectedValue(new Error("also-sensitive"));
    const result = await POST(request({ kind: "autocomplete", text: "Bengaluru" }));
    expect(result.status).toBe(502); expect(await result.text()).not.toContain("sensitive-provider");
  });
  it("surfaces fallback rate limits and enforces the local abuse guard", async () => {
    mocked.fetch.mockResolvedValue({ ok: false, status: 401 });
    mocked.fallback.mockResolvedValue({ ok: false, status: 429 });
    expect((await POST(request({ kind: "autocomplete", text: "Bengaluru" }))).status).toBe(429);
    mocked.allowed = false;
    expect((await POST(request({ kind: "autocomplete", text: "Bengaluru" }))).status).toBe(429);
    expect(mocked.fallback).toHaveBeenCalledTimes(1);
  });
});

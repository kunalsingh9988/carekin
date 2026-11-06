import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocked = vi.hoisted(() => ({ enabled: true, allowed: true, fetch: vi.fn() }));
vi.mock("@/lib/maps-server", () => ({ mapsEnabled: () => mocked.enabled, allowMapRequest: () => mocked.allowed, sameMapOrigin: (request: Request) => request.headers.get("origin") === new URL(request.url).origin, providerMapFetch: mocked.fetch }));
import { POST } from "./route";
function request(body: unknown, origin = "https://carekin-web.vercel.app") { return new Request("https://carekin-web.vercel.app/api/maps/address", { method: "POST", headers: { origin, "Content-Type": "application/json" }, body: JSON.stringify(body) }); }
describe("server-side map address gateway", () => {
  beforeEach(() => { mocked.enabled = true; mocked.allowed = true; mocked.fetch.mockReset(); });
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
  });
  it("does not reflect raw provider failures or credentials", async () => {
    mocked.fetch.mockRejectedValue(new Error("sensitive-provider-diagnostic"));
    const result = await POST(request({ kind: "autocomplete", text: "Bengaluru" }));
    expect(result.status).toBe(502); expect(await result.text()).not.toContain("sensitive-provider");
  });
  it("handles missing configuration and the local abuse guard", async () => {
    mocked.enabled = false; expect((await POST(request({ kind: "autocomplete", text: "Bengaluru" }))).status).toBe(503);
    mocked.enabled = true; mocked.allowed = false; expect((await POST(request({ kind: "autocomplete", text: "Bengaluru" }))).status).toBe(429);
  });
});

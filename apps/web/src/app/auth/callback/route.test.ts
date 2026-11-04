import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const { exchange } = vi.hoisted(() => ({ exchange: vi.fn() }));
vi.mock("@/lib/backend/server", () => ({ supabaseServer: async () => ({ auth: { exchangeCodeForSession: exchange } }) }));
import { GET } from "./route";

async function callback(query: string) {
  const response = await GET(new NextRequest(`https://carekin.example/auth/callback?${query}`));
  expect(response.headers.get("Cache-Control")).toContain("no-store");
  return new URL(response.headers.get("location")!);
}
describe("PKCE callback", () => {
  beforeEach(() => { exchange.mockReset(); exchange.mockResolvedValue({ error: null }); });
  it("exchanges the code then resumes the real account with its intended destination", async () => {
    const url = await callback("code=test-code&next=%2Fbook%2F123%2Fprofile&role=provider");
    expect(exchange).toHaveBeenCalledWith("test-code");
    expect(url.pathname).toBe("/sign-in");
    expect(url.searchParams.get("authenticated")).toBe("1");
    expect(url.searchParams.get("next")).toBe("/book/123/profile");
    expect(url.searchParams.get("role")).toBe("provider");
  });
  it("sends password recovery to its dedicated screen", async () => {
    expect((await callback("code=test-code&next=%2Freset-password")).pathname).toBe("/reset-password");
  });
  it("never accepts external redirects or an administrator enrollment hint", async () => {
    const url = await callback("code=test-code&next=%2F%2Fevil.example&role=admin");
    expect(url.origin).toBe("https://carekin.example");
    expect(url.searchParams.get("next")).toBe("/");
    expect(url.searchParams.get("role")).toBe("family");
  });
  it("handles cancelled consent without exchanging a supplied code", async () => {
    const url = await callback("code=test-code&error=access_denied&error_description=untrusted");
    expect(exchange).not.toHaveBeenCalled();
    expect(url.searchParams.get("error")).toBe("cancelled");
    expect(url.search).not.toContain("untrusted");
  });
  it("distinguishes expired confirmation links", async () => {
    const url = await callback("error=access_denied&error_code=otp_expired");
    expect(url.searchParams.get("error")).toBe("expired-link");
  });
  it("handles rejected and unavailable exchanges without a server error", async () => {
    exchange.mockResolvedValueOnce({ error: new Error("Invalid code") });
    expect((await callback("code=expired")).searchParams.get("error")).toBe("expired-link");
    exchange.mockRejectedValueOnce(new Error("Network down"));
    expect((await callback("code=unavailable")).searchParams.get("error")).toBe("unavailable");
  });
});

import { describe, expect, it } from "vitest";
import { authCallbackUrl, authErrorMessage, callbackErrorCode, safeNext, signupRole } from "./redirects";

describe("authentication navigation", () => {
  it("preserves internal destinations and query strings", () => {
    expect(safeNext("/book/provider-1/profile?step=2#details")).toBe("/book/provider-1/profile?step=2#details");
    expect(safeNext(undefined, "/provider")).toBe("/provider");
  });
  it.each(["https://evil.example", "//evil.example", "/\\evil.example", "/%2fevil.example", "/%5cevil.example", "/%0aevil", "/\nevil", "/%invalid", "/..//evil.example"])("rejects unsafe destination %s", value => {
    expect(safeNext(value, "/")).toBe("/");
  });
  it("preserves only public enrollment roles", () => {
    expect(signupRole("provider")).toBe("provider");
    expect(signupRole("admin")).toBe("family");
    expect(signupRole(null)).toBe("family");
  });
  it("builds a same-origin callback with a safe destination and role hint", () => {
    const url = new URL(authCallbackUrl("https://carekin.example", "/book/123/profile", "provider"));
    expect(url.origin + url.pathname).toBe("https://carekin.example/auth/callback");
    expect(url.searchParams.get("next")).toBe("/book/123/profile");
    expect(url.searchParams.get("role")).toBe("provider");
    const unsafe = new URL(authCallbackUrl("https://carekin.example", "//evil.example", "admin"));
    expect(unsafe.searchParams.get("next")).toBe("/");
    expect(unsafe.searchParams.get("role")).toBe("family");
  });
  it("provides actionable errors without reflecting untrusted descriptions", () => {
    expect(authErrorMessage("cancelled")).toContain("cancelled");
    expect(authErrorMessage("expired-link")).toContain("new confirmation");
    expect(authErrorMessage("untrusted-description")).not.toContain("untrusted-description");
    expect(authErrorMessage()).toBe("");
  });
  it("does not mislabel Google provider failures as expired email links", () => {
    expect(callbackErrorCode("server_error", "unexpected_failure")).toBe("oauth-failed");
    expect(callbackErrorCode("access_denied", null)).toBe("cancelled");
    expect(callbackErrorCode("access_denied", "otp_expired")).toBe("expired-link");
    expect(callbackErrorCode(null, null)).toBe("session-exchange-failed");
    expect(authErrorMessage("oauth-failed")).not.toContain("expired");
    expect(authErrorMessage("oauth-failed")).toContain("email and password");
  });
});

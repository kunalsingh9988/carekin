import { describe, expect, it } from "vitest";
import { accountInitials, AccountDetailsSchema, googleAvatarUrl, identityDetails } from "./profile";
import { ownedAvatarPath, validatePhoto } from "./avatar";

describe("private account profile", () => {
  it("uses Google portraits and safely rejects arbitrary hosts and schemes", () => {
    expect(googleAvatarUrl("https://lh3.googleusercontent.com/a/photo")).toBeTruthy();
    for (const url of ["javascript:alert(1)", "http://lh3.googleusercontent.com/a", "https://googleusercontent.com.attacker.test/a", "https://user:secret@lh3.googleusercontent.com/a", "https://example.com/track"]) expect(googleAvatarUrl(url)).toBeUndefined();
  });
  it("derives display data without trusting metadata roles or account IDs", () => {
    const result = identityDetails({ email: "test@example.test", user_metadata: { role: "admin", id: "someone-else", full_name: "Test Person", avatar_url: "https://lh3.googleusercontent.com/a" }, app_metadata: { providers: ["google"] } });
    expect(result).toMatchObject({ display_name: "Test Person", auth_providers: ["google"], email_verified: false });
    expect(result).not.toHaveProperty("role"); expect(result).not.toHaveProperty("id");
  });
  it("honors photo removal even if Google still supplies a picture", () => {
    expect(identityDetails({ user_metadata: { hide_account_photo: true, picture: "https://lh3.googleusercontent.com/a" } })).not.toHaveProperty("avatar_url");
  });
  it("validates names and optional unverified contact phones", () => {
    expect(AccountDetailsSchema.safeParse({ displayName: "Person", contactPhone: "" }).success).toBe(true);
    expect(AccountDetailsSchema.safeParse({ displayName: "Person", contactPhone: "+919876543210" }).success).toBe(true);
    expect(AccountDetailsSchema.safeParse({ displayName: " ", contactPhone: "email@example.test" }).success).toBe(false);
  });
  it("renders initials for missing and unicode names", () => {
    expect(accountInitials("Kunal Singh")).toBe("KS");
    expect(accountInitials(undefined, "test@example.test")).toBe("TE");
    expect(accountInitials("李 明")).toBe("李明");
  });
  it("restricts stored photos to the current account folder", () => {
    expect(ownedAvatarPath("owner/ab12-ef34.webp", "owner")).toBe(true);
    for (const path of ["other/ab12.webp", "owner/../other.webp", "owner/nested/photo.webp", "owner/ab12.svg"]) expect(ownedAvatarPath(path, "owner")).toBe(false);
  });
  it("rejects unsupported and oversized photo files", () => {
    expect(() => validatePhoto({ type: "image/png", size: 1000 })).not.toThrow();
    expect(() => validatePhoto({ type: "image/svg+xml", size: 1000 })).toThrow("JPG");
    expect(() => validatePhoto({ type: "image/jpeg", size: 6 * 1024 * 1024 })).toThrow("5 MB");
  });
});

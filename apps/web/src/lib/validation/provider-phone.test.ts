import { describe, expect, it } from "vitest";
import { PhoneNumber, providerPhoneDefault } from "./schemas";
describe("Google/email provider onboarding phone defaults",()=>{
  it("never prefills email identity into the phone field",()=>{
    expect(providerPhoneDefault("test@example.com")).toBe("+91");
    expect(providerPhoneDefault("")).toBe("+91");
    expect(providerPhoneDefault(undefined)).toBe("+91");
  });
  it("preserves a valid international phone number",()=>{
    expect(providerPhoneDefault(" +919876543210 ")).toBe("+919876543210");
  });
  it("still requires the user to supply a complete valid phone number",()=>{
    expect(PhoneNumber.safeParse(providerPhoneDefault("test@example.com")).success).toBe(false);
    expect(PhoneNumber.safeParse("test@example.com").success).toBe(false);
  });
});

import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DEVELOPMENT_PROVIDERS, DEMO_PROFILE_NOTICE, getDevelopmentProvider, isDevelopmentProviderId, listDevelopmentProviders } from "./development-providers";
import { DevelopmentProviderGallery } from "@/components/providers/DevelopmentProviderGallery";
describe("fictional development provider catalog",()=>{
  it("contains exactly ten of each kind with twenty stable unique IDs",()=>{
    expect(DEVELOPMENT_PROVIDERS).toHaveLength(20);
    expect(new Set(DEVELOPMENT_PROVIDERS.map(profile=>profile.id)).size).toBe(20);
    expect(listDevelopmentProviders("caregiver")).toHaveLength(10);
    expect(listDevelopmentProviders("babysitter")).toHaveLength(10);
  });
  it("contains no real credentials, verification claims, contacts, locations or reviews",()=>{
    for(const profile of DEVELOPMENT_PROVIDERS){
      expect(profile.bookable).toBe(false);
      expect(isDevelopmentProviderId(profile.id)).toBe(true);
      for(const field of ["phone","email","latitude","longitude","verification_status","rating","reviews","user_id"]){
        expect(profile).not.toHaveProperty(field);
      }
      expect(profile.bio).toContain("Fictional");
      expect(existsSync(resolve("public/images/carekin/brand-v2",`${profile.scene}.webp`))).toBe(true);
    }
  });
  it("searches names, IDs and sample care needs without geographic restrictions",()=>{
    expect(listDevelopmentProviders("caregiver","asha").map(profile=>profile.name)).toEqual(["Asha Mehta"]);
    expect(listDevelopmentProviders("babysitter","demo-carekin-babysitter-10")).toHaveLength(1);
    expect(listDevelopmentProviders("babysitter","story time").length).toBeGreaterThan(0);
    expect(listDevelopmentProviders("caregiver","missing sample")).toHaveLength(0);
    expect(getDevelopmentProvider("demo-carekin-babysitter-01")?.name).toBe("Nisha Patel");
    expect(getDevelopmentProvider("not-a-profile")).toBeUndefined();
  });
  it("labels every rendered card honestly and never exposes booking links or fake ratings",()=>{
    const html=renderToStaticMarkup(createElement(DevelopmentProviderGallery,{type:"babysitter",query:""}));
    expect(html.split(DEMO_PROFILE_NOTICE).length-1).toBe(10);
    expect(html.match(/View demo profile/g)).toHaveLength(10);
    expect(html).not.toContain('href="/book/');
    expect(html).not.toContain("Verified");
    expect(html).toContain("Bookings are disabled");
    expect(html).toContain("AI-generated illustration");
  });
});

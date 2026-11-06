import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
const state=vi.hoisted(() => ({loading:false,error:"",fetchLocation:vi.fn(),clearLocationRequest:vi.fn()}));
vi.mock("@/lib/hooks/useCurrentLocation", () => ({useCurrentLocation:()=>state}));
import { CoordinatePicker as LocationPicker } from "./LocationPicker";
describe("location recovery interface", () => {
  it("offers permission help and retry beside the failing action", () => {
    state.loading=false; state.error="Location access is blocked.";
    const html=renderToStaticMarkup(createElement(LocationPicker,{value:null,onChange:vi.fn()}));
    expect(html).toContain('role="alert"');
    expect(html).toContain("Try current location again");
    expect(html).toContain("Help enabling location");
    expect(html).toContain("Location Services");
    expect(html).toContain("Choose a city centre");
  });
  it("announces pending requests and provides cancellation", () => {
    state.loading=true; state.error="";
    const html=renderToStaticMarkup(createElement(LocationPicker,{value:null,onChange:vi.fn()}));
    expect(html).toContain("Finding your location…");
    expect(html).toContain("Cancel location request");
    expect(html).toContain('role="status"');
    expect(html).toContain("35 seconds");
  });
});

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import BookingLayout from "./layout";
describe("demo booking route",()=>{
  it("renders nested steps with a demo banner for demo profiles",async()=>{
    const output=await BookingLayout({children:createElement("form",null,"Payment form"),params:Promise.resolve({providerId:"demo-carekin-babysitter-01"})});
    const html=renderToStaticMarkup(output);
    expect(html).toContain("Demo booking");
    expect(html).toContain("fictional provider");
    expect(html).toContain("<form");
    expect(html).toContain("Payment form");
  });
  it("preserves normal booking routes",async()=>{
    const children=createElement("div",null,"Normal booking");
    expect(await BookingLayout({children,params:Promise.resolve({providerId:"real-provider"})})).toBe(children);
  });
});

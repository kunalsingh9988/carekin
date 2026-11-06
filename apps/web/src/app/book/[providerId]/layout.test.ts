import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import BookingLayout from "./layout";
describe("demo booking route guard",()=>{
  it("blocks direct links to every nested demo booking step",async()=>{
    const output=await BookingLayout({children:createElement("form",null,"Payment form"),params:Promise.resolve({providerId:"demo-carekin-babysitter-01"})});
    const html=renderToStaticMarkup(output);
    expect(html).toContain("Demo profiles cannot be booked");
    expect(html).not.toContain("Payment form");
    expect(html).not.toContain("<form");
  });
  it("preserves normal booking routes",async()=>{
    const children=createElement("div",null,"Normal booking");
    expect(await BookingLayout({children,params:Promise.resolve({providerId:"real-provider"})})).toBe(children);
  });
});

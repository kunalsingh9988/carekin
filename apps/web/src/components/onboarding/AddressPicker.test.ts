import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AddressPicker } from "./AddressPicker";

describe("address picker privacy and entry states", () => {
  it("shows mapping disclosure without mounting a map before the user opens it", () => {
    const html = renderToStaticMarkup(createElement(AddressPicker, { value: null, onChange: vi.fn() }));
    expect(html).toContain("Geoapify"); expect(html).toContain("Use current location");
    expect(html).not.toContain("leaflet-container"); expect(html).not.toContain("<dialog");
  });
  it("shows the saved address without exposing coordinates as the primary label", () => {
    const html = renderToStaticMarkup(createElement(AddressPicker, { value: { latitude: 12.97, longitude: 77.59 }, address: "Synthetic test address", onChange: vi.fn() }));
    expect(html).toContain("Synthetic test address"); expect(html).toContain("Change address");
    expect(html).not.toContain("12.97");
  });
});

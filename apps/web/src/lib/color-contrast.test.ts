import { describe, expect, it } from "vitest";
import tokens from "../../../../packages/ui-tokens/tokens.json";

function rgb(hex: string) {
  return hex.slice(1).match(/../g)!.map((channel) => parseInt(channel, 16));
}
function luminance(color: number[]) {
  return color.map((value) => {
    const channel = value / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  }).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
}
function contrast(foreground: number[], background: number[]) {
  const a = luminance(foreground), b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

describe.each(["light", "dark"] as const)("%s theme text contrast", (theme) => {
  const colors = tokens.color[theme];
  it("keeps body, placeholders, links, and status text readable on app surfaces", () => {
    for (const background of ["bgCanvas", "surface", "surfaceSecondary"] as const) {
      for (const foreground of ["textPrimary", "textSecondary", "accentText", "verified", "danger"] as const) {
        expect(contrast(rgb(colors[foreground].value), rgb(colors[background].value)), `${foreground} on ${background}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
  it("keeps white action labels readable in default, hover and pressed states", () => {
    for (const background of ["accent", "accentHover"] as const) {
      expect(contrast(rgb("#FFFFFF"), rgb(colors[background].value))).toBeGreaterThanOrEqual(4.5);
    }
    expect(contrast(rgb(colors.bgCanvas.value), rgb(colors.danger.value))).toBeGreaterThanOrEqual(4.5);
  });
  it("keeps small status labels readable on tinted badges", () => {
    expect(contrast(rgb(colors.accentText.value), rgb(colors.accentTint.value))).toBeGreaterThanOrEqual(4.5);
    for (const foreground of ["verified", "danger"] as const) {
      for (const background of ["surface", "surfaceSecondary"] as const) {
        const tint = rgb(colors[foreground].value).map((channel, index) => channel * 0.1 + rgb(colors[background].value)[index] * 0.9);
        expect(contrast(rgb(colors[foreground].value), tint), `${foreground} badge on ${background}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});

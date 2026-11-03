import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import manifest from "../../docs/brand-image-prompts.json";

const publicDir = fileURLToPath(new URL("../../public/", import.meta.url));
const sourceDir = fileURLToPath(new URL("../", import.meta.url));
function sources(dir: string): string[] { return readdirSync(dir).flatMap((name) => { const path = join(dir, name); return statSync(path).isDirectory() ? sources(path) : /\.(tsx|css)$/.test(name) ? [readFileSync(path, "utf8")] : []; }); }
describe("CareKin brand assets", () => {
  it("ships all seven unique optimized branded scenes with exact generation provenance", () => {
    const photos = manifest.assets.filter((asset) => asset.file.endsWith(".webp"));
    expect(photos).toHaveLength(7);
    const contents = photos.map((asset) => {
      const bytes = readFileSync(join(publicDir, asset.file));
      expect(bytes.subarray(0, 4).toString()).toBe("RIFF");
      expect(bytes.subarray(8, 12).toString()).toBe("WEBP");
      expect(bytes.byteLength).toBeLessThan(350_000);
      expect(asset.prompt).toContain('"CareKin"');
      expect(asset.prompt).toContain("T-SHIRT");
      expect(JSON.parse(readFileSync(join(publicDir, `${asset.file}.json`), "utf8"))).toBeTruthy();
      return bytes.toString("base64");
    });
    expect(new Set(contents).size).toBe(7);
  });
  it("ships transparent logo artwork and correctly sized browser/home-screen icons", () => {
    for (const [file, width, height] of [["../../public/images/brand/carekin-logo.png", 1680, 360], ["../app/icon.png", 128, 128], ["../app/apple-icon.png", 180, 180]] as const) {
      const bytes = readFileSync(new URL(file, import.meta.url));
      expect(bytes.subarray(1, 4).toString()).toBe("PNG");
      expect(bytes.readUInt32BE(16)).toBe(width); expect(bytes.readUInt32BE(20)).toBe(height);
    }
    expect(readFileSync(join(publicDir, "images/brand/carekin-logo.png"))[25]).toBe(6); // RGBA
  });
  it("has no remaining image consumers pointing to the retired library", () => {
    const code = sources(sourceDir).join("\n");
    expect(code).not.toMatch(/\/images\/carekin\/(?!brand-v2\/)/);
    expect(code).toContain("/images/brand/carekin-logo.png");
    expect(code).toContain('data-theme="dark"] .brand-logo');
  });
});

// Reproducible format/size conversion only; artwork is created with image_gen.
// Usage: node scripts/prepare-brand-assets.mjs logo|<scene-name> <generated.png>
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
const require = createRequire(import.meta.url);
const nextRequire = createRequire(require.resolve("next/package.json", { paths: [resolve("apps/web")] }));
const sharp = nextRequire("sharp");
const [name, source] = process.argv.slice(2);
if (!name || !source || !/^[a-z-]+$/.test(name)) throw new Error("Pass an asset name and generated PNG path.");
const publicDir = resolve("apps/web/public");
async function write(pipeline, path) { await mkdir(dirname(path), { recursive: true }); await pipeline.toFile(path); }
if (name === "logo") {
  await write(sharp(source).trim().resize(1680, 360, { fit: "contain", background: "transparent" }).png(), `${publicDir}/images/brand/carekin-logo.png`);
  // The generated master has a clean 29px transparent separator at x686–715.
  const crop = await sharp(source).extract({ left: 0, top: 0, width: 700, height: 724 }).png().toBuffer();
  const mark = await sharp(crop).trim().png().toBuffer();
  await write(sharp(mark).resize(512, 512, { fit: "contain", background: "transparent" }).png(), `${publicDir}/images/brand/carekin-mark.png`);
  await write(sharp(mark).resize(104, 104, { fit: "contain", background: "#ffffff" }).extend({ top: 12, bottom: 12, left: 12, right: 12, background: "#ffffff" }).flatten({ background: "#ffffff" }).png(), resolve("apps/web/src/app/icon.png"));
  await write(sharp(mark).resize(144, 144, { fit: "contain", background: "#ffffff" }).extend({ top: 18, bottom: 18, left: 18, right: 18, background: "#ffffff" }).flatten({ background: "#ffffff" }).png(), resolve("apps/web/src/app/apple-icon.png"));
} else {
  await write(sharp(source).resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 88, effort: 6 }), `${publicDir}/images/carekin/brand-v2/${name}.webp`);
}
console.log(`Prepared ${name}`);

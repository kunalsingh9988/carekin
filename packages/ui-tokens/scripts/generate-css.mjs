// Generates tokens.css from tokens.json so the two never drift — tokens.json
// stays the single source of truth (Section 6), this script is the only
// place allowed to hand-transcribe a value into CSS.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const tokens = JSON.parse(readFileSync(join(__dirname, "../tokens.json"), "utf-8"));

function kebab(key) {
  return key.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

function colorVars(scheme) {
  return Object.entries(tokens.color[scheme])
    .map(([key, token]) => `  --ck-color-${kebab(key)}: ${token.value};`)
    .join("\n");
}

function flatVars(section, prefix) {
  return Object.entries(tokens[section])
    .map(([key, token]) => `  --ck-${prefix}-${kebab(key)}: ${token.value};`)
    .join("\n");
}

function typographyVars() {
  const t = tokens.typography;
  const lines = [
    `  --ck-font-display-latin: ${t.fontDisplayLatin.value};`,
    `  --ck-font-display-devanagari: ${t.fontDisplayDevanagari.value};`,
    `  --ck-font-body-latin: ${t.fontBodyLatin.value};`,
    `  --ck-font-body-devanagari: ${t.fontBodyDevanagari.value};`,
  ];
  for (const [key, token] of Object.entries(t.scale)) {
    lines.push(`  --ck-text-${kebab(key)}: ${token.value};`);
  }
  return lines.join("\n");
}

const css = `/* GENERATED FILE — edit tokens.json and re-run \`node scripts/generate-css.mjs\`, not this file directly. */

:root {
${colorVars("light")}
${typographyVars()}
${flatVars("spacing", "space")}
${flatVars("radius", "radius")}
  --ck-size-min-tap-target: ${tokens.sizing.minTapTarget.value};
}

@media (prefers-color-scheme: dark) {
  :root {
${colorVars("dark")}
  }
}

:root[data-theme="dark"] {
${colorVars("dark")}
}

:root[data-theme="light"] {
${colorVars("light")}
}
`;

writeFileSync(join(__dirname, "../tokens.css"), css);
console.log("Wrote packages/ui-tokens/tokens.css");

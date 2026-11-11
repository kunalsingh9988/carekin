import { createHash } from "node:crypto";

export function mapsEnabled() { return !!process.env.GEOAPIFY_API_KEY?.trim(); }
const buckets = new Map<string, { start: number; count: number }>();

// Best-effort per-instance abuse guard; Geoapify remains the global quota
// authority. No raw IP, address query or coordinate is recorded in logs.
export function allowMapRequest(request: Request, type: "address" | "tile", now = Date.now()): boolean {
  const rawIp = request.headers.get("x-vercel-forwarded-for") || request.headers.get("x-forwarded-for") || "local";
  const key = `${type}:${createHash("sha256").update(rawIp).digest("hex")}`;
  if (buckets.size > 2000) for (const [key, bucket] of buckets) if (now - bucket.start > 60000) buckets.delete(key);
  if (buckets.size > 3000) return false;
  let bucket = buckets.get(key);
  if (!bucket || now - bucket.start >= 60000) { bucket = { start: now, count: 0 }; buckets.set(key, bucket); }
  return ++bucket.count <= (type === "address" ? 40 : 300);
}

export function sameMapOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !!origin && origin === new URL(request.url).origin;
}

export async function providerMapFetch(request: Request, path: string, params: Record<string, string>, tiles = false) {
  const url = new URL(path, tiles ? "https://maps.geoapify.com" : "https://api.geoapify.com");
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  url.searchParams.set("apiKey", process.env.GEOAPIFY_API_KEY!.trim());
  return fetch(url, { signal: AbortSignal.timeout(9000), cache: "no-store", headers: { Referer: `${new URL(request.url).origin}/`, Origin: new URL(request.url).origin } });
}

// Public OpenStreetMap endpoints used whenever the configured Geoapify key is
// missing or rejected — the map feature should degrade provider, not die.
// Policy-identifiable UA is required by OSM/Nominatim usage terms; light,
// development-preview volume only.
const MAP_UA = "CareKin/1.0 (https://carekin-web.vercel.app; development preview)";

export function openStreetMapTileFetch(z: number, x: number, y: number) {
  return fetch(`https://tile.openstreetmap.org/${z}/${x}/${y}.png`, { signal: AbortSignal.timeout(9000), cache: "no-store", headers: { "User-Agent": MAP_UA } });
}

export function nominatimFetch(path: "/search" | "/reverse", params: Record<string, string>) {
  const url = new URL(path, "https://nominatim.openstreetmap.org");
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("accept-language", "en");
  return fetch(url, { signal: AbortSignal.timeout(9000), cache: "no-store", headers: { "User-Agent": MAP_UA } });
}

// Nominatim returns a bare array for /search and a single object for /reverse —
// normalized here into the Geoapify-shaped { results: [...] } envelope the
// client parser already understands.
export function normalizeNominatim(payload: unknown): { results: unknown[] } {
  const items = Array.isArray(payload)
    ? payload
    : payload && typeof payload === "object" && "display_name" in payload ? [payload] : [];
  return {
    results: items.slice(0, 5).flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const record = item as Record<string, unknown>;
      const display = typeof record.display_name === "string" ? record.display_name : "";
      if (!display || record.lat === undefined || record.lon === undefined) return [];
      const parts = display.split(",");
      return [{
        place_id: String(record.place_id ?? ""),
        formatted: display,
        address_line1: parts[0]?.trim() || display,
        address_line2: parts.slice(1).join(",").trim(),
        lat: record.lat, lon: record.lon,
      }];
    }),
  };
}

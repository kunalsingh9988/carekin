import { createHash } from "node:crypto";

export function mapsEnabled() { return !!process.env.GEOAPIFY_API_KEY?.trim(); }
const buckets = new Map<string, { start: number; count: number }>();

// Best-effort per-instance abuse guard; upstream provider quotas remain the
// real authority. No raw IP, address query or coordinate is recorded in logs.
export function allowMapRequest(request: Request, type: "address" | "tile", now = Date.now()): boolean {
  // The client IP is the leftmost entry of the forwarded chain. When no
  // header exists at all (local dev, odd proxies) each request gets its own
  // key — a shared "unknown" bucket would collapse every visitor into one
  // global quota and starve the whole feature, which is worse than a gap.
  const forwarded = request.headers.get("x-vercel-forwarded-for") || request.headers.get("x-forwarded-for") || "";
  const rawIp = forwarded.split(",")[0].trim() || crypto.randomUUID();
  const key = `${type}:${createHash("sha256").update(rawIp).digest("hex")}`;
  if (buckets.size > 2000) for (const [key, bucket] of buckets) if (now - bucket.start > 60000) buckets.delete(key);
  if (buckets.size > 3000) return false;
  let bucket = buckets.get(key);
  if (!bucket || now - bucket.start >= 60000) { bucket = { start: now, count: 0 }; buckets.set(key, bucket); }
  return ++bucket.count <= (type === "address" ? 60 : 600);
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

// Photon (Komoot's OSM geocoder) is the primary fallback for search and
// reverse lookups — purpose-built for as-you-type address autocomplete and
// far more tolerant of shared cloud egress IPs than public Nominatim, which
// rate-limits Vercel ranges aggressively.
export function photonFetch(path: "/api" | "/reverse", params: Record<string, string>) {
  const url = new URL(path, "https://photon.komoot.io");
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  url.searchParams.set("lang", "en");
  return fetch(url, { signal: AbortSignal.timeout(9000), cache: "no-store", headers: { "User-Agent": MAP_UA } });
}

// Photon returns GeoJSON features — normalized into the same envelope.
export function normalizePhoton(payload: unknown): { results: unknown[] } {
  const features = payload && typeof payload === "object" && Array.isArray((payload as Record<string, unknown>).features)
    ? (payload as { features: unknown[] }).features : [];
  return {
    results: features.slice(0, 5).flatMap((feature) => {
      if (!feature || typeof feature !== "object") return [];
      const f = feature as { properties?: Record<string, unknown>; geometry?: { coordinates?: unknown } };
      const p = f.properties ?? {};
      const c = f.geometry?.coordinates;
      if (!Array.isArray(c) || c.length < 2 || typeof c[0] !== "number" || typeof c[1] !== "number") return [];
      const pick = (key: string) => typeof p[key] === "string" ? p[key] as string : "";
      const street = [pick("housenumber"), pick("street")].filter(Boolean).join(" ");
      const line1 = pick("name") || street || pick("suburb") || pick("neighbourhood") || pick("city") || pick("district");
      const line2 = [pick("name") && street, pick("suburb") || pick("neighbourhood"), pick("city") || pick("district"), pick("state"), pick("postcode"), pick("country")].filter(Boolean).join(", ");
      const formatted = [line1, line2].filter(Boolean).join(", ");
      if (!formatted) return [];
      return [{ place_id: String(p.osm_id ?? ""), formatted, address_line1: line1, address_line2: line2, lat: c[1], lon: c[0] }];
    }),
  };
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

// Short-lived result cache: identical searches (keystroke bursts, reopened
// pickers, retried pin drops) never reach an upstream provider at all.
const addressCache = new Map<string, { at: number; body: unknown }>();
const CACHE_TTL_MS = 10 * 60 * 1000;
export function cachedAddress(key: string): unknown | null {
  const entry = addressCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.at > CACHE_TTL_MS) { addressCache.delete(key); return null; }
  return entry.body;
}
export function cacheAddress(key: string, body: unknown): void {
  if (addressCache.size > 500) addressCache.clear();
  addressCache.set(key, { at: Date.now(), body });
}

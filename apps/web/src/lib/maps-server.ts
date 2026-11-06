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

import { allowMapRequest, cacheAddress, cachedAddress, mapsEnabled, nominatimFetch, normalizeNominatim, normalizePhoton, photonFetch, providerMapFetch, sameMapOrigin } from "@/lib/maps-server";
import { parseCoordinates } from "@/lib/locations";

export async function POST(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  if (!sameMapOrigin(request)) return Response.json({ error: "Use address search from the CareKin website." }, { status: 403, headers });
  try {
    const body = await request.text();
    if (body.length > 3000) return Response.json({ error: "Address request is too long." }, { status: 400, headers });
    const input = JSON.parse(body);
    let path: string, params: Record<string, string>, cacheKey: string;
    let photon: ["/api" | "/reverse", Record<string, string>];
    let nominatim: ["/search" | "/reverse", Record<string, string>];
    if (input.kind === "autocomplete" && typeof input.text === "string" && input.text.trim().length >= 3 && input.text.length <= 200) {
      const text = input.text.trim();
      path = "/v1/geocode/autocomplete"; params = { text, format: "json", lang: "en", limit: "5" };
      photon = ["/api", { q: text, limit: "5" }];
      nominatim = ["/search", { q: text, limit: "5", addressdetails: "1" }];
      cacheKey = `autocomplete:${text.toLowerCase()}`;
    } else if (input.kind === "reverse" && typeof input.latitude === "number" && typeof input.longitude === "number" && parseCoordinates(String(input.latitude), String(input.longitude))) {
      const lat = String(input.latitude), lon = String(input.longitude);
      path = "/v1/geocode/reverse"; params = { lat, lon, format: "json", lang: "en", limit: "1" };
      photon = ["/reverse", { lat, lon }];
      nominatim = ["/reverse", { lat, lon, zoom: "18", addressdetails: "1" }];
      cacheKey = `reverse:${Number(lat).toFixed(4)},${Number(lon).toFixed(4)}`;
    } else return Response.json({ error: "Enter a valid address or location." }, { status: 400, headers });
    // Cached lookups are free — repeat searches and pin drops must never
    // consume the per-IP quota that protects upstream providers.
    const cached = cachedAddress(cacheKey);
    if (cached) return Response.json(cached, { headers });
    if (!allowMapRequest(request, "address")) return Response.json({ error: "Too many address requests. Wait a minute and try again." }, { status: 429, headers });
    // Geoapify when its key works → Photon (autocomplete-tolerant geocoder)
    // → Nominatim. A broken credential or a throttled shared egress IP should
    // degrade the provider, never the feature.
    if (mapsEnabled()) {
      try {
        const attempt = await providerMapFetch(request, path, params);
        if (attempt.ok) { const payload = await attempt.json(); cacheAddress(cacheKey, payload); return Response.json(payload, { headers }); }
      } catch { /* fall through */ }
    }
    try {
      const attempt = await photonFetch(photon[0], photon[1]);
      if (attempt.ok) { const payload = normalizePhoton(await attempt.json()); cacheAddress(cacheKey, payload); return Response.json(payload, { headers }); }
    } catch { /* last resort below */ }
    const response = await nominatimFetch(nominatim[0], nominatim[1]);
    if (!response.ok) return Response.json({ error: response.status === 429 ? "Address service is busy. Wait a moment and try again." : "Address lookup is unavailable. Try again or use manual entry." }, { status: response.status === 429 ? 429 : 502, headers: { ...headers, "X-Map-Provider-Status": String(response.status) } });
    const payload = normalizeNominatim(await response.json());
    cacheAddress(cacheKey, payload);
    return Response.json(payload, { headers });
  } catch { return Response.json({ error: "We couldn’t look up this address. Check your connection and try again." }, { status: 502, headers }); }
}

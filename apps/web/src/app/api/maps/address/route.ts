import { allowMapRequest, mapsEnabled, nominatimFetch, normalizeNominatim, providerMapFetch, sameMapOrigin } from "@/lib/maps-server";
import { parseCoordinates } from "@/lib/locations";

export async function POST(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  if (!sameMapOrigin(request)) return Response.json({ error: "Use address search from the CareKin website." }, { status: 403, headers });
  if (!allowMapRequest(request, "address")) return Response.json({ error: "Too many address requests. Wait a minute and try again." }, { status: 429, headers });
  try {
    const body = await request.text();
    if (body.length > 3000) return Response.json({ error: "Address request is too long." }, { status: 400, headers });
    const input = JSON.parse(body);
    let path: string, params: Record<string, string>, fallback: ["/search" | "/reverse", Record<string, string>];
    if (input.kind === "autocomplete" && typeof input.text === "string" && input.text.trim().length >= 3 && input.text.length <= 200) {
      path = "/v1/geocode/autocomplete"; params = { text: input.text.trim(), format: "json", lang: "en", limit: "5" };
      fallback = ["/search", { q: input.text.trim(), limit: "5", addressdetails: "1" }];
    } else if (input.kind === "reverse" && typeof input.latitude === "number" && typeof input.longitude === "number" && parseCoordinates(String(input.latitude), String(input.longitude))) {
      path = "/v1/geocode/reverse"; params = { lat: String(input.latitude), lon: String(input.longitude), format: "json", lang: "en", limit: "1" };
      fallback = ["/reverse", { lat: String(input.latitude), lon: String(input.longitude), zoom: "18", addressdetails: "1" }];
    } else return Response.json({ error: "Enter a valid address or location." }, { status: 400, headers });
    // Geoapify when its key works; otherwise the public Nominatim service
    // keeps search and pin-drop working while the credential is broken.
    if (mapsEnabled()) {
      try {
        const attempt = await providerMapFetch(request, path, params);
        if (attempt.ok) return Response.json(await attempt.json(), { headers });
      } catch { /* fall back to Nominatim */ }
    }
    const response = await nominatimFetch(fallback[0], fallback[1]);
    if (!response.ok) return Response.json({ error: response.status === 429 ? "Address service is busy. Wait a moment and try again." : "Address lookup is unavailable. Try again or use manual entry." }, { status: response.status === 429 ? 429 : 502, headers: { ...headers, "X-Map-Provider-Status": String(response.status) } });
    return Response.json(normalizeNominatim(await response.json()), { headers });
  } catch { return Response.json({ error: "We couldn’t look up this address. Check your connection and try again." }, { status: 502, headers }); }
}

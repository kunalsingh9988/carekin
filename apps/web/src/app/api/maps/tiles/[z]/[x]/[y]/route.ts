import { allowMapRequest, mapsEnabled, openStreetMapTileFetch, providerMapFetch } from "@/lib/maps-server";

export async function GET(request: Request, context: { params: Promise<{ z: string; x: string; y: string }> }) {
  const parts = await context.params;
  const z = Number(parts.z), x = Number(parts.x), y = Number(parts.y);
  if (![parts.z, parts.x, parts.y].every(value => /^\d{1,7}$/.test(value)) || ![z, x, y].every(Number.isInteger) || z < 0 || z > 20 || x < 0 || y < 0 || x >= 2 ** z || y >= 2 ** z) return new Response(null, { status: 400 });
  if (!allowMapRequest(request, "tile")) return new Response(null, { status: 429 });
  try {
    const retina = new URL(request.url).searchParams.get("retina") === "1" ? "@2x" : "";
    // Geoapify first when configured; on any upstream failure the request
    // falls back to the public OSM tile server rather than breaking the map.
    let response: Response | null = null;
    if (mapsEnabled()) {
      try {
        const attempt = await providerMapFetch(request, `/v1/tile/osm-bright/${z}/${x}/${y}${retina}.png`, {}, true);
        if (attempt.ok && attempt.headers.get("content-type")?.startsWith("image/png")) response = attempt;
      } catch { /* fall back to OSM */ }
    }
    if (!response) {
      const attempt = await openStreetMapTileFetch(z, x, y);
      if (attempt.ok && attempt.headers.get("content-type")?.startsWith("image/png")) response = attempt;
    }
    if (!response) return new Response(null, { status: 502 });
    const bytes = await response.arrayBuffer();
    if (bytes.byteLength > 2 * 1024 * 1024) return new Response(null, { status: 502 });
    return new Response(bytes, { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=86400, s-maxage=86400", "X-Content-Type-Options": "nosniff" } });
  } catch { return new Response(null, { status: 502 }); }
}

import { allowMapRequest, mapsEnabled, providerMapFetch } from "@/lib/maps-server";

export async function GET(request: Request, context: { params: Promise<{ z: string; x: string; y: string }> }) {
  const parts = await context.params;
  const z = Number(parts.z), x = Number(parts.x), y = Number(parts.y);
  if (![parts.z, parts.x, parts.y].every(value => /^\d{1,7}$/.test(value)) || ![z, x, y].every(Number.isInteger) || z < 0 || z > 20 || x < 0 || y < 0 || x >= 2 ** z || y >= 2 ** z) return new Response(null, { status: 400 });
  if (!mapsEnabled()) return new Response(null, { status: 503 });
  if (!allowMapRequest(request, "tile")) return new Response(null, { status: 429 });
  try {
    const retina = new URL(request.url).searchParams.get("retina") === "1" ? "@2x" : "";
    const response = await providerMapFetch(request, `/v1/tile/osm-bright/${z}/${x}/${y}${retina}.png`, {}, true);
    if (!response.ok || !response.headers.get("content-type")?.startsWith("image/png")) return new Response(null, { status: response.status === 429 ? 429 : 502, headers: { "X-Map-Provider-Status": String(response.status) } });
    const bytes = await response.arrayBuffer();
    if (bytes.byteLength > 2 * 1024 * 1024) return new Response(null, { status: 502 });
    return new Response(bytes, { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=86400, s-maxage=86400", "X-Content-Type-Options": "nosniff" } });
  } catch { return new Response(null, { status: 502 }); }
}

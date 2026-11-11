import { mapsEnabled } from "@/lib/maps-server";
export function GET() { return Response.json({ enabled: true, provider: mapsEnabled() ? "geoapify" : "openstreetmap-fallback" }, { headers: { "Cache-Control": "no-store" } }); }

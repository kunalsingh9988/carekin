import { mapsEnabled } from "@/lib/maps-server";
export function GET() { return Response.json({ enabled: mapsEnabled() }, { headers: { "Cache-Control": "no-store" } }); }

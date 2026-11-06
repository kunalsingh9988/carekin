import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { backendConfig, backendEnabled } from "@/lib/backend/config";

export async function proxy(request: NextRequest) {
  // Public map responses contain no account data. Avoid an Auth round trip
  // for every tile and let the map routes apply their own cache/abuse policy.
  if (request.nextUrl.pathname.startsWith("/api/maps/")) return NextResponse.next();
  if (!backendEnabled) return NextResponse.next();
  const { url, key } = backendConfig();
  let response = NextResponse.next({ request });
  const client = createServerClient(url, key, { cookies: {
    getAll: () => request.cookies.getAll(),
    setAll: (values) => {
      for (const { name, value } of values) request.cookies.set(name, value);
      response = NextResponse.next({ request });
      for (const { name, value, options } of values) response.cookies.set(name, value, options);
    },
  } });
  const { data: { user } } = await client.auth.getUser();
  const protectedPath = /^\/(family|provider|admin)(\/|$)/.test(request.nextUrl.pathname);
  if (protectedPath && !user) {
    const destination = new URL("/sign-in", request.url);
    destination.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
    const redirect = NextResponse.redirect(destination);
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    return redirect;
  }
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export const config = { matcher: ["/((?!_next/static|_next/image|images|icon.png|apple-icon.png|favicon.ico).*)"] };

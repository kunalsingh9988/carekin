import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Refreshes the Supabase session on every request via HTTP-only cookies.
// This is session bookkeeping only — actual route protection (redirecting
// an unauthenticated or wrong-role user away from a page) happens in that
// page's Server Component via `supabase.auth.getUser()`, not here.
//
// Named/placed per Next.js 16's rename of this convention from
// `middleware.ts` to `proxy.ts` (same file conventions as `app/` — so
// src/proxy.ts here, since this project uses the src/ layout). The spec's
// own file tree predates the rename and nests it under lib/, which
// wouldn't be discovered at all under either name.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  // Re-validates the JWT against Supabase's servers — never swap this for
  // getSession(), which only reads the (spoofable) cookie (Section 5.1).
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};

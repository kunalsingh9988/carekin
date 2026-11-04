import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/backend/server";
import { callbackErrorCode, safeNext, signupRole } from "@/lib/auth/redirects";
function redirect(destination: URL) {
  const response = NextResponse.redirect(destination);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = request.nextUrl.searchParams.get("next");
  const destination = new URL("/sign-in", request.url);
  if (next) destination.searchParams.set("next", safeNext(next, "/"));
  destination.searchParams.set("role", signupRole(request.nextUrl.searchParams.get("role")));
  if (code && !request.nextUrl.searchParams.has("error")) {
    try {
      const client = await supabaseServer();
      const { error } = await client.auth.exchangeCodeForSession(code);
      if (!error) {
        if (next === "/reset-password") return redirect(new URL(next, request.url));
        destination.searchParams.set("authenticated", "1");
        return redirect(destination);
      }
    } catch {
      destination.searchParams.set("error", "unavailable");
      return redirect(destination);
    }
  }
  destination.searchParams.set("error", callbackErrorCode(request.nextUrl.searchParams.get("error"), request.nextUrl.searchParams.get("error_code")));
  return redirect(destination);
}

import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/backend/server";
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = request.nextUrl.searchParams.get("next");
  if (code) {
    const client = await supabaseServer();
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next === "/reset-password" ? next : "/sign-in", request.url));
  }
  return NextResponse.redirect(new URL("/sign-in?error=expired-link", request.url));
}

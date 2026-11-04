// Only navigate within CareKin, never to a URL supplied by an auth query string.
export function safeNext(value: string | null | undefined, fallback = "/family"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u0020]/.test(value)) return fallback;
  try {
    const url = new URL(value, "https://carekin.invalid");
    const decoded = decodeURIComponent(url.pathname);
    if (url.origin !== "https://carekin.invalid" || decoded.startsWith("//") || /[\\\u0000-\u0020]/.test(decoded)) return fallback;
    return url.pathname + url.search + url.hash;
  } catch { return fallback; }
}

export function signupRole(value?: string | null): "family" | "provider" {
  return value === "provider" ? "provider" : "family";
}

export function authCallbackUrl(origin: string, next?: string, role?: string) {
  const url = new URL("/auth/callback", origin);
  if (next) url.searchParams.set("next", safeNext(next, "/"));
  if (role) url.searchParams.set("role", signupRole(role));
  return url.toString();
}

export function authErrorMessage(code?: string | null) {
  if (code === "cancelled") return "Google sign-in was cancelled. Try again or use your email and password.";
  if (code === "oauth-failed") return "Google sign-in is temporarily unavailable because the authentication provider could not complete sign-in. Please use email and password while we resolve this.";
  if (code === "session-exchange-failed") return "We couldn’t finish your sign-in session. Start sign-in again in this browser, or use your email and password.";
  if (code === "expired-link") return "This sign-in link is invalid, expired, or already used. If you have confirmed your email, sign in below. Otherwise request a new confirmation email.";
  if (code) return "We couldn’t complete sign-in. Please try Google again or use your email and password.";
  return "";
}

// Never display or forward raw provider descriptions, which can contain codes.
export function callbackErrorCode(error: string | null, code: string | null) {
  if (code === "otp_expired") return "expired-link";
  if (error === "access_denied") return "cancelled";
  if (error) return "oauth-failed";
  return "session-exchange-failed";
}

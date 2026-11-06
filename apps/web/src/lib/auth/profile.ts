import { z } from "zod";

// Only Google-hosted account portraits are loaded. Never allow arbitrary
// user-metadata URLs to track viewers or execute non-HTTPS schemes.
export function googleAvatarUrl(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length > 2048) return;
  try {
    const url = new URL(value);
    if (url.protocol === "https:" && !url.username && !url.password &&
      (url.hostname === "googleusercontent.com" || url.hostname.endsWith(".googleusercontent.com"))) return url.href;
  } catch { /* Missing/invalid portraits fall back to initials. */ }
}

export function accountInitials(name?: string, email?: string): string {
  const words = (name?.trim() || email?.split("@")[0] || "CareKin").split(/\s+/);
  return Array.from(words.length > 1 ? `${Array.from(words[0])[0]}${Array.from(words[words.length - 1])[0]}` : words[0]).slice(0, 2).join("").toLocaleUpperCase();
}

export const AccountDetailsSchema = z.object({
  displayName: z.string().trim().min(1, "Enter your name.").max(100, "Use 100 characters or fewer."),
  contactPhone: z.string().trim().refine(value => !value || /^\+[1-9]\d{7,14}$/.test(value), "Enter an international phone number, such as +919876543210, or leave it empty."),
});

export function identityDetails(user: {
  email?: string; phone?: string; email_confirmed_at?: string; phone_confirmed_at?: string;
  last_sign_in_at?: string; user_metadata?: Record<string, unknown>; app_metadata?: Record<string, unknown>;
}) {
  const metadata = user.user_metadata ?? {};
  const name = metadata.display_name ?? metadata.full_name ?? metadata.name;
  const avatar = metadata.hide_account_photo === true ? undefined : googleAvatarUrl(metadata.avatar_url ?? metadata.picture);
  const providers = user.app_metadata?.providers;
  return {
    ...(user.email ? { email: user.email } : {}),
    ...(typeof name === "string" && name.trim() ? { display_name: name.trim().slice(0, 100) } : {}),
    ...(avatar ? { avatar_url: avatar } : {}),
    ...(typeof metadata.contact_phone === "string" ? { contact_phone: metadata.contact_phone } : {}),
    ...(user.email ? { email_verified: !!user.email_confirmed_at } : {}),
    ...(user.phone ? { phone_verified: !!user.phone_confirmed_at } : {}),
    ...(Array.isArray(providers) ? { auth_providers: providers.filter((item): item is string => typeof item === "string") } : {}),
    ...(user.last_sign_in_at ? { last_sign_in_at: user.last_sign_in_at } : {}),
  };
}

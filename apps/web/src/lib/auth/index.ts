// Lightweight "current user" concept — NOT real authentication (Guardrails,
// Section 3/8). Synchronous and separate from the async repository pattern
// in lib/storage/repositories on purpose: this is session state, not
// domain data that would come from a real backend later.
import { get, newId, set, remove } from "../storage/client";
import type { CurrentUser, UserRole } from "../storage/types";

const KEY = "currentUser";

// A real auth SDK gives components a session-changed event (e.g. Supabase's
// onAuthStateChange) — this is the equivalent for mock auth, so the navbar
// (and anything else) updates the instant the login modal succeeds, not
// only after a full page reload.
const listeners = new Set<(user: CurrentUser | null) => void>();

export function subscribeToAuthChanges(listener: (user: CurrentUser | null) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify(user: CurrentUser | null): void {
  listeners.forEach((l) => l(user));
}

export function getCurrentUser(): CurrentUser | null {
  return get<CurrentUser | null>(KEY, null);
}

// Demo mode: any 6-digit code works, role is selected at login for
// convenience. First login for a phone+role creates the user; logging back
// in with the same phone reuses the same id so seeded data keeps lining up.
export function loginAsRole(phone: string, role: UserRole): CurrentUser {
  const existing = get<Record<string, CurrentUser>>("usersByPhone", {});
  const user = existing[phone] ?? { id: newId(), role, phone, created_at: new Date().toISOString() };
  existing[phone] = user;
  set("usersByPhone", existing);
  set(KEY, user);
  notify(user);
  return user;
}

export function logout(): void {
  remove(KEY);
  notify(null);
}

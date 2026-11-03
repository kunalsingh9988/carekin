// Backend mode derives identity from Supabase Auth and the private account role.
// The local/demo session implementation is retained only for explicit demo mode.
import { useSyncExternalStore } from "react";
import { get, newId, set, remove } from "../storage/client";
import type { CurrentUser, UserRole } from "../storage/types";
import { backendEnabled } from "../backend/config";
import { remote, supabaseBrowser } from "../backend/browser";

const KEY = "currentUser";
const STORAGE_EVENT_KEY = `carekin:${KEY}`;

// A real auth SDK gives components a session-changed event (e.g. Supabase's
// onAuthStateChange) — this is the equivalent for mock auth, so the navbar
// (and anything else) updates the instant the login modal succeeds, not
// only after a full page reload. Also listens for `storage` events so auth
// stays consistent across open tabs of the same browser.
const listeners = new Set<(user: CurrentUser | null) => void>();

// useSyncExternalStore requires a STABLE snapshot: getSnapshot must return
// the same object between store changes or React loops forever. This cache
// is only ever replaced inside loginAsRole/logout/the storage handler —
// i.e. exactly when listeners are notified.
let cachedUser: CurrentUser | null | undefined;

function readUser(): CurrentUser | null {
  if (backendEnabled) return cachedUser ?? null;
  if (cachedUser === undefined) cachedUser = get<CurrentUser | null>(KEY, null);
  return cachedUser;
}

function commitUser(user: CurrentUser | null): void {
  cachedUser = user;
  listeners.forEach((l) => l(user));
}

export function subscribeToAuthChanges(listener: (user: CurrentUser | null) => void): () => void {
  listeners.add(listener);

  function onStorage(e: StorageEvent) {
    if (e.key === STORAGE_EVENT_KEY) {
      cachedUser = undefined;
      listener(readUser());
    }
  }
  if (typeof window !== "undefined") window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
  };
}

// React hook form — hydration-safe (server snapshot is always null, so the
// first client render matches SSR; the real session appears post-mount).
export function useCurrentUser(): CurrentUser | null {
  return useSyncExternalStore(subscribeToAuthChanges, readUser, () => null);
}

export function getCurrentUser(): CurrentUser | null {
  return readUser();
}

// Demo mode: any 6-digit code works, role is selected at login. Users are
// keyed by phone+role — the same phone can hold a family, a provider, and
// an admin identity side by side, and logging back into an existing pair
// reuses the same id so seeded data keeps lining up.
export function loginAsRole(phone: string, role: UserRole): CurrentUser {
  if (backendEnabled) throw new Error("Sign in with your Supabase account.");
  const existing = get<Record<string, CurrentUser>>("usersByPhone", {});
  const key = `${phone}:${role}`;
  const user = existing[key] ?? { id: newId(), role, phone, created_at: new Date().toISOString() };
  existing[key] = user;
  set("usersByPhone", existing);
  set(KEY, user);
  commitUser(user);
  return user;
}

export function logout(): void {
  if (backendEnabled) {
    void supabaseBrowser().auth.signOut().then(() => { commitUser(null); window.location.assign("/"); });
    return;
  }
  remove(KEY);
  commitUser(null);
}

// Demo sessions — the no-login path (there is no real auth backend). Fixed
// ids that reuse the SEEDED user identities, so skipping lands on populated
// dashboards (seed-family-1's bookings, seed-provider-1's payouts) instead
// of empty fresh accounts. Deliberately not stored under usersByPhone —
// that map is for phone-typed logins; demo is keyed by role alone.
const DEMO_USERS: Record<UserRole, CurrentUser> = {
  family: { id: "seed-family-user-1", role: "family", phone: "+910000000001", created_at: "2025-01-01T00:00:00.000Z" },
  provider: { id: "seed-provider-user-1", role: "provider", phone: "+910000000002", created_at: "2025-01-01T00:00:00.000Z" },
  admin: { id: "seed-admin-user", role: "admin", phone: "+910000000003", created_at: "2025-01-01T00:00:00.000Z" },
};

export function isDemoUser(user: CurrentUser | null): boolean {
  return !!user && Object.values(DEMO_USERS).some((d) => d.id === user.id);
}

export function loginAsDemo(role: UserRole): CurrentUser {
  if (backendEnabled) throw new Error("Demo role switching is disabled in backend mode.");
  const user = DEMO_USERS[role];
  set(KEY, user);
  commitUser(user);
  return user;
}

export async function refreshCurrentUser(): Promise<CurrentUser | null> {
  if (!backendEnabled) return getCurrentUser();
  const { data: { user } } = await supabaseBrowser().auth.getUser();
  const current = user ? await remote<CurrentUser | null>("auth.me") : null;
  commitUser(current);
  return current;
}

export function initializeBackendAuth() {
  if (!backendEnabled) return () => {};
  void refreshCurrentUser().catch(() => commitUser(null));
  const { data } = supabaseBrowser().auth.onAuthStateChange(() => {
    // Avoid awaiting Supabase calls inside its synchronous auth callback.
    setTimeout(() => { void refreshCurrentUser().catch(() => commitUser(null)); }, 0);
  });
  return () => data.subscription.unsubscribe();
}

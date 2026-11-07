// Backend mode derives identity from Supabase Auth and the private account role.
// The local/demo session implementation is retained only for explicit demo mode.
import { useSyncExternalStore } from "react";
import { get, newId, set, remove } from "../storage/client";
import type { CurrentUser, UserRole } from "../storage/types";
import { backendEnabled } from "../backend/config";
import { remote, supabaseBrowser } from "../backend/browser";
import { AccountDetailsSchema, identityDetails } from "./profile";
import { AVATAR_BUCKET, ownedAvatarPath, privateAvatarUrl } from "./avatar";

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

export async function logout(): Promise<void> {
  if (backendEnabled) {
    const { error } = await supabaseBrowser().auth.signOut();
    if (error) throw error;
    commitUser(null);
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

// Self-service family↔provider switching. Profiles live in separate tables
// keyed by user_id, so switching preserves each side's records — the
// provider application and family details are still there when you switch
// back. Admin can never be reached this way, in either mode.
export async function switchRole(role: "family" | "provider"): Promise<CurrentUser> {
  if (!backendEnabled) return loginAsDemo(role);
  const account = await remote<CurrentUser | null>("auth.switchRole", [role]);
  if (!account) throw new Error("Role switching is only available to family and provider accounts.");
  await refreshCurrentUser();
  return account;
}

export async function refreshCurrentUser(): Promise<CurrentUser | null> {
  if (!backendEnabled) return getCurrentUser();
  const { data: { user } } = await supabaseBrowser().auth.getUser();
  const account = user ? await remote<CurrentUser | null>("auth.me") : null;
  // Role and account ID remain server-owned, never copied from user metadata.
  const current = account && user ? { ...account, ...identityDetails(user) } : null;
  if (current && user && ownedAvatarPath(user.user_metadata?.avatar_path, user.id)) {
    current.avatar_path = user.user_metadata.avatar_path;
    current.avatar_url = await privateAvatarUrl(current.avatar_path, user.id);
  }
  commitUser(current);
  return current;
}

export async function saveAccountPhoto(photo: Blob | null): Promise<void> {
  const current = getCurrentUser();
  if (!current) throw new Error("Sign in before changing your photo.");
  if (!backendEnabled) throw new Error("Photo storage requires a connected account. Demo accounts use initials.");
  const path = photo ? `${current.id}/${crypto.randomUUID()}.${photo.type === "image/png" ? "png" : photo.type === "image/jpeg" ? "jpg" : "webp"}` : null;
  if (path && photo) {
    const { error } = await supabaseBrowser().storage.from(AVATAR_BUCKET).upload(path, photo, { contentType: photo.type, upsert: false });
    if (error) throw new Error("Your photo could not be uploaded. Check your connection and try again.");
  }
  const { error } = await supabaseBrowser().auth.updateUser({ data: { avatar_path: path, hide_account_photo: !photo } });
  if (error) {
    if (path) await supabaseBrowser().storage.from(AVATAR_BUCKET).remove([path]);
    throw new Error("Your photo was not saved to your account. Please try again.");
  }
  await refreshCurrentUser();
  if (ownedAvatarPath(current.avatar_path, current.id)) {
    await supabaseBrowser().storage.from(AVATAR_BUCKET).remove([current.avatar_path]);
  }
}

export async function saveAccountDetails(input: { displayName: string; contactPhone: string }): Promise<void> {
  const details = AccountDetailsSchema.parse(input);
  const current = getCurrentUser();
  if (!current) throw new Error("Sign in before editing your account.");
  if (backendEnabled) {
    const { error } = await supabaseBrowser().auth.updateUser({ data: { display_name: details.displayName, contact_phone: details.contactPhone } });
    if (error) throw error;
    await refreshCurrentUser();
  } else {
    const updated = { ...current, display_name: details.displayName, contact_phone: details.contactPhone };
    set(KEY, updated);
    const users = get<Record<string, CurrentUser>>("usersByPhone", {});
    for (const key of Object.keys(users)) if (users[key].id === current.id) users[key] = updated;
    set("usersByPhone", users);
    commitUser(updated);
  }
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

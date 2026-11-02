// The ONLY module allowed to touch window.localStorage directly. Every
// repository and every component goes through get/set/remove here — this
// is the seam where Supabase gets swapped in later (Guardrails, Section 5).

const PREFIX = "carekin:";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function get<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  const raw = window.localStorage.getItem(PREFIX + key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function set<T>(key: string, value: T): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (err) {
    // QuotaExceededError or storage disabled (private mode) — a failed write
    // must not crash the page; the read path already falls back gracefully.
    console.warn(`[carekin] localStorage write failed for "${PREFIX + key}":`, err);
  }
}

export function remove(key: string): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(PREFIX + key);
}

export function newId(): string {
  return isBrowser() && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

// Minimal Map-backed localStorage stub for tests — client.ts only needs
// `window.localStorage` to exist; every other window API is untouched.
import { vi } from "vitest";

export function installLocalStorageMock(): void {
  const store = new Map<string, string>();
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, String(v)),
      removeItem: (k: string) => store.delete(k),
      clear: () => store.clear(),
      get length() {
        return store.size;
      },
      key: (i: number) => [...store.keys()][i] ?? null,
    },
  });
}

export function clearLocalStorage(): void {
  window.localStorage.clear();
}

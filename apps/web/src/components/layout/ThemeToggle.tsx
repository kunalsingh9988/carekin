"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { set } from "@/lib/storage/client";

const CHANGE_EVENT = "carekin:theme-change";

function subscribe(listener: () => void) {
  function onStorage(event: StorageEvent) {
    if (event.key !== "carekin:theme" && event.key !== null) return;
    let value: unknown;
    try { value = event.newValue ? JSON.parse(event.newValue) : "light"; } catch { value = "light"; }
    document.documentElement.dataset.theme = value === "dark" ? "dark" : "light";
    listener();
  }
  window.addEventListener(CHANGE_EVENT, listener);
  window.addEventListener("storage", onStorage);
  return () => { window.removeEventListener(CHANGE_EVENT, listener); window.removeEventListener("storage", onStorage); };
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, () => document.documentElement.dataset.theme === "dark" ? "dark" : "light", () => "light");
  const dark = theme === "dark";
  function toggle() {
    const next = dark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    set("theme", next);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }
  return <button type="button" onClick={toggle} aria-label={`Switch to ${dark ? "light" : "dark"} mode`} title={`Switch to ${dark ? "light" : "dark"} mode`} className="flex min-h-tap min-w-tap items-center justify-center gap-2 rounded-md border border-border px-3 text-sm font-medium text-text-primary hover:bg-surface-secondary">{dark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}<span className="hidden xl:inline">{dark ? "Dark" : "Light"}</span></button>;
}

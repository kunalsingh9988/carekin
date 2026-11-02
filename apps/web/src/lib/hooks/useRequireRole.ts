"use client";

import { useEffect, useState } from "react";
import { getCurrentUser, loginAsDemo } from "@/lib/auth";
import type { CurrentUser, UserRole } from "@/lib/storage/types";

// Client-side route guard (no real auth/RLS in this prototype — Guardrails,
// Section 2). No-login build: instead of redirecting, a missing or
// wrong-role session falls through to the shared demo identity for that
// role — every surface stays browsable, and the navbar's Demo chip keeps
// the substitution honest. Returns null while the check is in flight so
// pages don't flash content.
export function useRequireRole(role: UserRole): CurrentUser | null {
  const [user, setUser] = useState<CurrentUser | null | undefined>(undefined);

  useEffect(() => {
    // Deferred to a microtask: the session read is synchronous localStorage
    // I/O, and running it inside the effect body is flagged by the React
    // lint rules — the check still completes before paint either way.
    queueMicrotask(() => {
      const current = getCurrentUser();
      setUser(current?.role === role ? current : loginAsDemo(role));
    });
  }, [role]);

  return user ?? null;
}

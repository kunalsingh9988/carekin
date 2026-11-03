"use client";

import { useEffect, useState } from "react";
import { getCurrentUser, loginAsDemo, refreshCurrentUser } from "@/lib/auth";
import { backendEnabled } from "@/lib/backend/config";
import { useRouter } from "next/navigation";
import type { CurrentUser, UserRole } from "@/lib/storage/types";

// Backend mode refreshes authenticated identity and redirects wrong-role users.
// Database authorization remains the security boundary; this guard is UX only.
// Legacy role substitution is available only when backend mode is disabled.
export function useRequireRole(role: UserRole): CurrentUser | null {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null | undefined>(undefined);

  useEffect(() => {
    if (backendEnabled) {
      let active = true;
      void refreshCurrentUser().then((current) => {
        if (!active) return;
        if (!current) router.replace(`/sign-in?next=${encodeURIComponent(window.location.pathname)}`);
        else if (current.role !== role) router.replace(`/${current.role}`);
        else setUser(current);
      }).catch(() => router.replace("/sign-in"));
      return () => { active = false; };
    }
    // Deferred to a microtask: the session read is synchronous localStorage
    // I/O, and running it inside the effect body is flagged by the React
    // lint rules — the check still completes before paint either way.
    queueMicrotask(() => {
      const current = getCurrentUser();
      setUser(current?.role === role ? current : loginAsDemo(role));
    });
  }, [role, router]);

  return user ?? null;
}

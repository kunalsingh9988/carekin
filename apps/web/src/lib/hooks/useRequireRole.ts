"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import type { CurrentUser, UserRole } from "@/lib/storage/types";

// Client-side route guard (no real auth/RLS in this prototype — Guardrails,
// Section 2). Redirects home if there's no session or the wrong role, and
// returns null while that check is in flight so pages don't flash content.
export function useRequireRole(role: UserRole): CurrentUser | null {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null | undefined>(undefined);

  useEffect(() => {
    const current = getCurrentUser();
    if (!current || current.role !== role) {
      router.replace("/");
      return;
    }
    setUser(current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  return user ?? null;
}

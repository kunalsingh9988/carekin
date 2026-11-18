"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, loginAsDemo, refreshCurrentUser, switchRole } from "@/lib/auth";
import { backendEnabled } from "@/lib/backend/config";
import type { CurrentUser } from "@/lib/storage/types";

// Booking pages need a family-mode identity: the backend only lets a
// 'family' account save the family profile or create bookings. "Book care"
// and "Provide care" are usage modes, not separate accounts — a signed-in
// provider who starts booking switches to seeker mode automatically (both
// profiles are preserved and they can switch back from /account anytime).
// Admin accounts hold no family/provider profile and can never be switched
// into one, so they get an explicit block instead of a redirect loop.
export function useRequireBookingRole(): { user: CurrentUser | null; blocked: string } {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null | undefined>(undefined);
  const [blocked, setBlocked] = useState("");
  const started = useRef(false);

  useEffect(() => {
    if (!backendEnabled) {
      queueMicrotask(() => {
        const current = getCurrentUser();
        setUser(current?.role === "family" ? current : loginAsDemo("family"));
      });
      return;
    }
    if (started.current) return;
    started.current = true;
    let active = true;
    void refreshCurrentUser().then(async (current) => {
      if (!active) return;
      if (!current) { router.replace(`/sign-in?next=${encodeURIComponent(window.location.pathname)}`); return; }
      if (current.role === "family") { setUser(current); return; }
      if (current.role === "provider") {
        try { const switched = await switchRole("family"); if (active) setUser(switched); }
        catch (error) { if (active) setBlocked(error instanceof Error ? error.message : "We couldn't switch your account to book care. Please try again."); }
        return;
      }
      setBlocked("Administrator accounts can't book services — sign in with a family or provider account.");
    }).catch(() => { if (active) router.replace("/sign-in"); });
    return () => { active = false; };
  }, [router]);

  return { user: user ?? null, blocked };
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCurrentUser, logout, subscribeToAuthChanges } from "@/lib/auth";
import type { CurrentUser } from "@/lib/storage/types";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { LanguageToggle } from "./LanguageToggle";
import { NotificationBell } from "./NotificationBell";

const ROLE_LINKS: Record<CurrentUser["role"], { href: string; label: string }[]> = {
  family: [
    { href: "/family/search", label: "Search" },
    { href: "/family/bookings", label: "My bookings" },
    { href: "/family/settings", label: "Settings" },
  ],
  provider: [
    { href: "/provider/bookings", label: "Bookings" },
    { href: "/provider/verification-status", label: "Verification" },
    { href: "/provider/payouts", label: "Payouts" },
    { href: "/provider/settings", label: "Settings" },
  ],
  admin: [
    { href: "/admin/verification-queue", label: "Verification" },
    { href: "/admin/bookings", label: "Bookings" },
    { href: "/admin/disputes", label: "Disputes" },
    { href: "/admin/payouts", label: "Payouts" },
  ],
};

export function Navbar() {
  const router = useRouter();
  const { open } = useAuthModal();
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    setUser(getCurrentUser());
    return subscribeToAuthChanges(setUser);
  }, []);

  function handleLogout() {
    logout();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-4">
      <div className="flex items-center gap-8">
        <Link href="/" className="font-display-latin text-lg font-semibold text-text-primary">
          CareKin
        </Link>
        {user && (
          <nav className="hidden items-center gap-5 md:flex">
            {ROLE_LINKS[user.role].map((link) => (
              <Link key={link.href} href={link.href} className="text-sm font-medium text-text-secondary">
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </div>

      <div className="flex items-center gap-3">
        <LanguageToggle />
        {user ? (
          <>
            <NotificationBell userId={user.id} />
            <button onClick={handleLogout} className="min-h-tap rounded-md px-3 text-sm font-medium text-text-secondary">
              Log out
            </button>
          </>
        ) : (
          <button onClick={open} className="min-h-tap rounded-md bg-accent px-4 text-sm font-semibold text-white">
            Log in / Sign up
          </button>
        )}
      </div>
    </header>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { isDemoUser, logout, useCurrentUser } from "@/lib/auth";
import type { CurrentUser } from "@/lib/storage/types";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { LanguageToggle } from "./LanguageToggle";
import { NotificationBell } from "./NotificationBell";

// /search is public (Section 5.1) — always shown, not gated behind login.
const PUBLIC_LINKS = [{ href: "/search", label: "Search" }];

const ROLE_LINKS: Record<CurrentUser["role"], { href: string; label: string }[]> = {
  family: [
    { href: "/family", label: "Dashboard" },
    { href: "/family/bookings", label: "My bookings" },
    { href: "/family/referrals", label: "Referrals" },
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
  const user = useCurrentUser();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    setMenuOpen(false);
    logout();
    router.push("/");
    router.refresh();
  }

  const links = !user ? PUBLIC_LINKS : user.role === "family" ? [...PUBLIC_LINKS, ...ROLE_LINKS.family] : ROLE_LINKS[user.role];

  return (
    <header className="border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-lg font-bold text-text-primary">
            CareKin
          </Link>
          <nav className="hidden items-center gap-5 md:flex">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="text-sm font-medium text-text-secondary">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <LanguageToggle />
          {user ? (
            <>
              {isDemoUser(user) && (
                <span className="rounded-full bg-surface-secondary px-2.5 py-1 text-xs font-medium text-text-secondary">
                  Demo
                </span>
              )}
              <NotificationBell userId={user.id} />
              <button onClick={handleLogout} className="min-h-tap hidden rounded-md px-3 text-sm font-medium text-text-secondary md:block">
                Log out
              </button>
            </>
          ) : (
            <button onClick={() => open()} className="min-h-tap rounded-md bg-accent px-4 text-sm font-semibold text-white">
              Log in / Sign up
            </button>
          )}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex min-h-tap min-w-tap items-center justify-center md:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-5 w-5 text-text-primary" /> : <Menu className="h-5 w-5 text-text-primary" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="mt-3 flex flex-col gap-1 border-t border-border pt-3 md:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="min-h-tap flex items-center rounded-md px-2 text-sm font-medium text-text-primary"
            >
              {link.label}
            </Link>
          ))}
          {user && (
            <button onClick={handleLogout} className="min-h-tap flex items-center rounded-md px-2 text-left text-sm font-medium text-text-secondary">
              Log out
            </button>
          )}
        </nav>
      )}
    </header>
  );
}

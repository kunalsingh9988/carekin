"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Menu, X } from "lucide-react";
import { isDemoUser, logout, useCurrentUser } from "@/lib/auth";
import type { CurrentUser } from "@/lib/storage/types";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { LanguageToggle } from "./LanguageToggle";
import { NotificationBell } from "./NotificationBell";
import { ThemeToggle } from "./ThemeToggle";

// /search is public (Section 5.1) — always shown, not gated behind login.
const PUBLIC_LINKS = [
  { href: "/search", label: "Find care" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/cities", label: "Cities" },
  { href: "/get-started", label: "Get started" },
];

const ROLE_LINKS: Record<CurrentUser["role"], { href: string; label: string }[]> = {
  family: [
    { href: "/family", label: "Dashboard" },
    { href: "/family/bookings", label: "My bookings" },
    { href: "/family/referrals", label: "Referrals" },
    { href: "/family/settings", label: "Settings" },
  ],
  provider: [
    { href: "/provider", label: "Dashboard" },
    { href: "/provider/bookings", label: "Bookings" },
    { href: "/provider/verification-status", label: "Verification" },
    { href: "/provider/payouts", label: "Payouts" },
    { href: "/provider/settings", label: "Settings" },
  ],
  admin: [
    { href: "/admin", label: "Dashboard" },
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

  const links = !user ? PUBLIC_LINKS : user.role === "family" ? [PUBLIC_LINKS[0], ...ROLE_LINKS.family] : ROLE_LINKS[user.role];

  return (
    <header className="site-header sticky top-0 z-30 border-b border-border/80 bg-surface/95 px-4 py-3 backdrop-blur sm:px-6">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-lg font-bold tracking-[-0.03em] text-text-primary">
            Care<span className="text-accent-text">Kin</span>
          </Link>
          <nav className="hidden items-center gap-5 lg:flex">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="text-sm font-medium text-text-secondary">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <div className="hidden sm:block"><LanguageToggle /></div>
          {user ? (
            <>
              {isDemoUser(user) && (
                <span className="hidden rounded-full bg-surface-secondary px-2.5 py-1 text-xs font-medium text-text-secondary sm:inline-flex">
                  Demo
                </span>
              )}
              <NotificationBell userId={user.id} />
              <button onClick={handleLogout} className="min-h-tap hidden rounded-md px-3 text-sm font-medium text-text-secondary md:block">
                Log out
              </button>
            </>
          ) : (
            <button onClick={() => open()} className="min-h-tap rounded-lg border border-border px-3 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-secondary sm:px-4">
              Log in
            </button>
          )}
          {!user && <Link href="/search" className="hidden min-h-tap items-center gap-1.5 rounded-lg bg-accent px-4 text-sm font-semibold text-white transition-colors hover:bg-accent-hover sm:inline-flex">Find care <ArrowRight className="h-4 w-4" /></Link>}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex min-h-tap min-w-tap items-center justify-center lg:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="site-navigation"
          >
            {menuOpen ? <X className="h-5 w-5 text-text-primary" /> : <Menu className="h-5 w-5 text-text-primary" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav id="site-navigation" className="mt-3 flex max-h-[calc(100dvh-6rem)] flex-col gap-1 overflow-y-auto overscroll-contain border-t border-border pt-3 lg:hidden">
          <div className="sm:hidden"><LanguageToggle /></div>
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

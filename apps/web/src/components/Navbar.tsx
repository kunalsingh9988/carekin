"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { useAuthModal } from "./auth/AuthModalProvider";

export function Navbar() {
  const supabase = createClient();
  const router = useRouter();
  const { open } = useAuthModal();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    // Keeps the navbar in sync the moment AuthModal completes a login —
    // no manual coordination needed between the two components.
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-4">
      <Link href="/" className="font-display-latin text-lg font-semibold text-text-primary">
        CareKin
      </Link>

      {!loading &&
        (user ? (
          <button onClick={handleLogout} className="min-h-tap rounded-md px-4 text-sm font-medium text-text-secondary">
            Log out
          </button>
        ) : (
          <button onClick={open} className="min-h-tap rounded-md bg-accent px-4 text-sm font-semibold text-white">
            Log in / Sign up
          </button>
        ))}
    </header>
  );
}

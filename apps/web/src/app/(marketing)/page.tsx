"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { HeartHandshake, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/Card";

export default function Home() {
  const router = useRouter();
  const [location, setLocation] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push("/search");
  }

  return (
    <main className="flex flex-1 flex-col">
      <section className="flex flex-col items-center gap-4 px-6 py-20 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent-text">Verified caregivers &amp; babysitters</p>
        <h1 className="font-display-latin max-w-lg text-4xl font-semibold text-text-primary">
          Someone you can actually trust, in your home.
        </h1>
        <p className="max-w-md text-text-secondary">
          Every caregiver on CareKin passes ID verification, a police check, and an in-person interview — before you
          ever see their profile.
        </p>

        <form onSubmit={handleSearch} className="mt-2 flex w-full max-w-md gap-2">
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Enter your area to see verified caregivers near you"
            className="min-h-tap flex-1 rounded-md border border-border bg-surface px-4 text-base text-text-primary"
          />
          <button type="submit" className="min-h-tap rounded-md bg-accent px-6 text-base font-semibold text-white">
            Search now
          </button>
        </form>

        <div className="mt-6 grid w-full max-w-md grid-cols-1 gap-3 sm:grid-cols-2">
          <Link href="/search" className="rounded-lg border border-border bg-surface p-4 text-left">
            <p className="font-medium text-text-primary">Find elder care</p>
            <p className="text-sm text-text-secondary">For a parent who needs company and support</p>
          </Link>
          <Link href="/search" className="rounded-lg border border-border bg-surface p-4 text-left">
            <p className="font-medium text-text-primary">Find a babysitter</p>
            <p className="text-sm text-text-secondary">For evenings, workdays, or a regular plan</p>
          </Link>
        </div>

        <p className="mt-6 text-sm text-text-secondary">
          [X] verified caregivers · 4-step background check on every profile · Live in [X] neighborhoods
        </p>
      </section>

      <section className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-6 pb-24">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="flex flex-col items-center gap-2 text-center">
            <ShieldCheck className="h-7 w-7 text-verified" />
            <p className="text-sm font-medium text-text-primary">1. Search verified profiles near you</p>
          </Card>
          <Card className="flex flex-col items-center gap-2 text-center">
            <HeartHandshake className="h-7 w-7 text-accent" />
            <p className="text-sm font-medium text-text-primary">2. Book a visit or a weekly plan</p>
          </Card>
          <Card className="flex flex-col items-center gap-2 text-center">
            <ShieldCheck className="h-7 w-7 text-accent" />
            <p className="text-sm font-medium text-text-primary">3. Message and pay — all in the app</p>
          </Card>
        </div>
        <Link href="/how-it-works" className="text-center text-sm font-medium text-accent-text underline">
          See exactly how verification works →
        </Link>
      </section>

      <section className="flex flex-col items-center gap-4 border-t border-border px-6 py-16 text-center">
        <h2 className="text-2xl font-semibold text-text-primary">Ready to find someone you trust?</h2>
        <Link href="/search" className="min-h-tap flex items-center rounded-md bg-accent px-6 text-base font-semibold text-white">
          Search now
        </Link>
      </section>
    </main>
  );
}

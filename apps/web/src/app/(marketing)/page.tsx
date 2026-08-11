"use client";

import { ShieldCheck, Search, CalendarCheck } from "lucide-react";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { Card } from "@/components/ui/Card";

export default function Home() {
  const { open } = useAuthModal();

  return (
    <main className="flex flex-1 flex-col">
      <section className="flex flex-col items-center gap-4 px-6 py-24 text-center">
        <h1 className="font-display-latin text-4xl font-semibold text-text-primary">CareKin</h1>
        <p className="max-w-md text-text-secondary">
          Verified elder caregivers and babysitters, in your neighborhood. Every provider is background-checked and
          approved by our team before they ever appear here.
        </p>
        <button onClick={open} className="min-h-tap mt-2 flex items-center rounded-md bg-accent px-6 text-base font-semibold text-white">
          Get started
        </button>
      </section>

      <section className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-4 px-6 pb-24 sm:grid-cols-3">
        <Card className="flex flex-col items-center gap-2 text-center">
          <ShieldCheck className="h-8 w-8 text-verified" />
          <p className="font-medium text-text-primary">Verified, always</p>
          <p className="text-sm text-text-secondary">Aadhaar eKYC, police verification, and a human admin — not just an algorithm.</p>
        </Card>
        <Card className="flex flex-col items-center gap-2 text-center">
          <Search className="h-8 w-8 text-accent" />
          <p className="font-medium text-text-primary">Nearby, not nationwide</p>
          <p className="text-sm text-text-secondary">We launch one neighborhood at a time, so every match is genuinely local.</p>
        </Card>
        <Card className="flex flex-col items-center gap-2 text-center">
          <CalendarCheck className="h-8 w-8 text-accent" />
          <p className="font-medium text-text-primary">Book in minutes</p>
          <p className="text-sm text-text-secondary">One-off visits or recurring plans — pay in-app, chat once confirmed.</p>
        </Card>
      </section>
    </main>
  );
}

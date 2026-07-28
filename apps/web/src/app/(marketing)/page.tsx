"use client";

import { useAuthModal } from "@/components/auth/AuthModalProvider";

export default function Home() {
  const { open } = useAuthModal();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-display-latin text-3xl font-semibold text-text-primary">CareKin</h1>
      <p className="max-w-md text-text-secondary">
        Verified elder caregivers and babysitters, in your neighborhood. Every provider is background-checked and
        approved by our team before they ever appear here.
      </p>
      <button
        onClick={open}
        className="min-h-tap mt-2 flex items-center rounded-md bg-accent px-6 text-base font-semibold text-white"
      >
        Get started
      </button>
    </main>
  );
}

"use client";

import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/workspace/PageShell";

// Shared failure surface for client-side data loads: a rejected repo call
// (offline, expired session, backend error) must never leave a page stuck
// on its loading sentinel — show the reason and a way to retry.
export function LoadError({ error }: { error: string }) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-6 py-8">
      <Notice error>{error}</Notice>
      <Button variant="secondary" onClick={() => window.location.reload()}>Try again</Button>
    </main>
  );
}

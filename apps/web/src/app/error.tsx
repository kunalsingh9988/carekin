"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <TriangleAlert className="h-10 w-10 text-danger" strokeWidth={1.5} />
      <h1 className="text-2xl font-semibold text-text-primary">Something went wrong</h1>
      <p className="max-w-sm text-text-secondary">
        This is a prototype — data lives in your browser&apos;s localStorage, so a reset here won&apos;t lose your
        demo progress.
      </p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}

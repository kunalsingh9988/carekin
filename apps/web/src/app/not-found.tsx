import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <Compass className="h-10 w-10 text-text-secondary" strokeWidth={1.5} />
      <h1 className="text-2xl font-semibold text-text-primary">Page not found</h1>
      <p className="max-w-sm text-text-secondary">The page you&apos;re looking for doesn&apos;t exist, or you don&apos;t have access to it.</p>
      <Link href="/" className="min-h-tap flex items-center rounded-md bg-accent px-6 text-sm font-semibold text-white">
        Back to home
      </Link>
    </main>
  );
}

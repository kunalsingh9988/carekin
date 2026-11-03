import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export function PageShell({ title, description, back, image, children }: { title: string; description: string; back?: { href: string; label: string }; image?: string; children: ReactNode }) {
  return <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-7 px-4 py-8 sm:px-6 sm:py-12">
    {back && <Link href={back.href} className="inline-flex min-h-tap items-center self-start text-sm font-semibold text-accent-text">← {back.label}</Link>}
    <header className={`grid gap-6 ${image ? "md:grid-cols-[1.3fr_0.7fr] md:items-center" : ""}`}>
      <div className="max-w-2xl"><h1 className="text-3xl font-bold leading-3xl sm:text-4xl sm:leading-4xl">{title}</h1><p className="mt-3 text-base leading-base text-text-secondary">{description}</p></div>
      {image && <div className="relative h-40 overflow-hidden rounded-lg sm:h-48"><Image src={`/images/carekin/brand-v2/${image}.webp`} alt="Illustrative scene of care at home" fill sizes="(max-width: 767px) 100vw, 33vw" className="object-cover" /><span className="absolute bottom-2 right-2 rounded-md bg-ink px-2 py-1 text-xs text-white">Illustrative care scene</span></div>}
    </header>
    {children}
  </main>;
}

export function Notice({ children, error = false }: { children: ReactNode; error?: boolean }) {
  return <p role={error ? "alert" : "status"} className={`rounded-md border border-border bg-surface-secondary p-4 text-sm leading-sm ${error ? "text-danger" : "text-text-secondary"}`}>{children}</p>;
}

export function DetailRows({ rows }: { rows: [string, ReactNode][] }) {
  return <dl className="divide-y divide-border">{rows.map(([label, value]) => <div key={label} className="grid gap-1 py-4 sm:grid-cols-[1fr_2fr] sm:gap-6"><dt className="text-sm text-text-secondary">{label}</dt><dd className="min-w-0 break-words text-sm font-medium">{value}</dd></div>)}</dl>;
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import type { UserRole } from "@/lib/storage/types";

const PATHS: { role: UserRole; title: string; body: string; image: string; action: string; steps: string }[] = [
  { role: "family", title: "Find care for your family", body: "A familiar routine. An extra pair of hands. Tell us who needs support and find verified care nearby.", image: "hero-family-care", action: "Set up my family account", steps: "Your details · Care needs · Start exploring" },
  { role: "provider", title: "Share your care and experience", body: "Whether you support elders or look after children, introduce yourself and start your care application.", image: "caregiver-arrival", action: "Start my provider application", steps: "Your profile · Documents · Application review" },
  { role: "admin", title: "Explore care operations", body: "Take a guided tour of verification, bookings and payouts in the CareKin demo workspace.", image: "elder-care-checkin", action: "Explore admin onboarding", steps: "Workspace tour · Review guidance · Demo access" },
];

export default function GetStartedPage() {
  const { open } = useAuthModal();
  return <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10 sm:py-14"><div className="mx-auto max-w-2xl text-center"><h1 className="text-4xl font-bold leading-4xl text-text-primary">A little introduction. A better beginning.</h1><p className="mt-4 text-base leading-base text-text-secondary">Choose how you’d like to use CareKin. We’ll guide you through the details, one step at a time.</p></div><div className="mt-10 grid gap-6 lg:grid-cols-3">{PATHS.map((path) => <article key={path.role} className="flex overflow-hidden rounded-lg border border-border bg-surface flex-col sm:flex-row lg:flex-col"><div className="relative aspect-[4/3] sm:aspect-auto sm:w-2/5 sm:shrink-0 lg:aspect-[4/3] lg:w-full"><Image src={`/images/carekin/brand-v2/${path.image}.webp`} alt={`Illustrative care scene for ${path.role} onboarding`} fill sizes="(max-width: 639px) 100vw, (max-width: 1023px) 40vw, 33vw" className={`object-cover ${path.role === "provider" ? "object-top" : ""}`} /><span className="absolute bottom-3 right-3 rounded-md bg-ink px-2 py-1 text-xs text-white">Illustrative scene</span></div><div className="flex flex-1 flex-col gap-4 p-6"><h2 className="text-2xl font-bold text-text-primary">{path.title}</h2><p className="text-sm leading-sm text-text-secondary">{path.body}</p><p className="mt-auto text-xs leading-sm text-text-secondary">{path.steps}</p><button onClick={() => open(path.role)} className="flex min-h-tap items-center justify-between gap-2 rounded-md bg-accent px-4 py-3 text-left text-sm font-semibold text-white hover:bg-accent-hover">{path.action}<ArrowRight className="h-4 w-4 shrink-0" /></button></div></article>)}</div><p className="mt-8 text-center text-sm text-text-secondary">Just looking around? <Link href="/search" className="font-semibold text-accent-text underline underline-offset-4">Browse care without an account</Link></p></main>;
}

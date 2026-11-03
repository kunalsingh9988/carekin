"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/ui/BrandLogo";

export function SupportFooter() {
  const path = usePathname();
  if (/^\/(family|provider|providers|admin|book)(\/|$)/.test(path)) return null;
  return <footer className="border-t border-border bg-surface-secondary px-4 py-8 sm:px-6"><div className="mx-auto flex max-w-6xl flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div><Link href="/" aria-label="CareKin home" className="inline-flex min-h-tap items-center"><BrandLogo /></Link><p className="mt-2 max-w-sm text-sm leading-sm text-text-secondary">A care marketplace prototype. Visits, verification and payments are simulated. AI-generated brand imagery shows illustrative people, not actual provider portraits.</p></div><nav aria-label="Support and policies" className="flex max-w-xl flex-wrap gap-x-6 gap-y-2">{[["/help", "Help centre"], ["/contact", "Contact support"], ["/privacy", "Privacy"], ["/terms", "Terms"], ["/cancellation-policy", "Cancellations"]].map(([href, label]) => <Link key={href} href={href} className="flex min-h-tap items-center text-sm font-medium text-accent-text">{label}</Link>)}</nav></div></footer>;
}

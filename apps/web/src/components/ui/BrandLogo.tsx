import Image from "next/image";

/** One lockup across public, onboarding and signed-in surfaces. */
export function BrandLogo({ className = "", priority = false }: { className?: string; priority?: boolean }) {
  return <Image src="/images/brand/carekin-logo.png" alt="CareKin" width={420} height={90} sizes="(max-width: 359px) 96px, (max-width: 639px) 128px, 144px" priority={priority} className={`brand-logo h-auto w-24 shrink-0 min-[360px]:w-32 sm:w-36 ${className}`} />;
}

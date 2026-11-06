import type { Metadata } from "next";
import Link from "next/link";
import { isDevelopmentProviderId } from "@/lib/development-providers";

export const metadata: Metadata = {
  title: "Book a verified provider",
  description: "Choose a visit or weekly plan with a verified CareKin provider — no account needed until you're ready.",
};

export default async function BookingLayout({ children, params }: { children: React.ReactNode; params: Promise<{providerId:string}> }) {
  const {providerId}=await params;
  if(isDevelopmentProviderId(providerId)) return <main className="mx-auto grid max-w-lg gap-4 px-6 py-12"><h1 className="text-2xl font-semibold">Demo profiles cannot be booked</h1><p>This is a fictional development profile, not a real care provider. No booking or payment will be created.</p><Link href="/search" className="min-h-tap text-accent-text">Return to search</Link></main>;
  return children;
}

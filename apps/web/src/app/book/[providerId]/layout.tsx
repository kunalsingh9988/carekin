import type { Metadata } from "next";
import { isDevelopmentProviderId } from "@/lib/development-providers";

export const metadata: Metadata = {
  title: "Book a verified provider",
  description: "Choose a visit or weekly plan with a verified CareKin provider — no account needed until you're ready.",
};

export default async function BookingLayout({ children, params }: { children: React.ReactNode; params: Promise<{providerId:string}> }) {
  const {providerId}=await params;
  // Demo profiles may be booked for testing — their bookings stay on this
  // device and no real person is notified. The banner keeps that honest
  // through every funnel step.
  if(isDevelopmentProviderId(providerId)) return <>
    <div className="border-b border-border bg-accent-tint px-6 py-2 text-center text-xs font-medium text-text-primary">Demo booking — fictional provider · saved on this device only · no visit will take place</div>
    {children}
  </>;
  return children;
}

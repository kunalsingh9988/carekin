import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book a verified provider",
  description: "Choose a visit or weekly plan with a verified CareKin provider — no account needed until you're ready.",
};

export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return children;
}

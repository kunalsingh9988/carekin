import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verified provider profile",
  description: "A verified CareKin provider — ID checked, police verified, and interviewed by our team.",
};

export default function ProviderProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Provider",
  robots: { index: false },
};

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  return children;
}

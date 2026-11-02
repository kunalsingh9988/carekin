import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Family dashboard",
  robots: { index: false },
};

export default function FamilyLayout({ children }: { children: React.ReactNode }) {
  return children;
}

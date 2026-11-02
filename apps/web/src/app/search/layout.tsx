import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search verified caregivers & babysitters",
  description: "Browse verified elder caregivers and babysitters near you — every profile passed ID verification, a police check, and an interview.",
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}

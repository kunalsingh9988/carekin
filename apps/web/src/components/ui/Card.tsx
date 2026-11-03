import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`min-w-0 rounded-lg border border-border bg-surface p-4 ${className}`}>{children}</div>;
}

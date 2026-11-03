import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

interface CommonProps {
  variant?: Variant;
  fullWidth?: boolean;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-accent text-white hover:bg-accent-text active:bg-accent-text",
  secondary: "border border-border bg-surface text-text-primary hover:bg-surface-secondary",
  danger: "bg-danger text-white",
  ghost: "text-accent-text hover:bg-accent-tint",
};

const BASE = "min-h-tap min-w-0 inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-center text-sm font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none";

export function Button({
  variant = "primary",
  fullWidth,
  className = "",
  children,
  ...rest
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement> & { className?: string }) {
  return (
    <button className={`${BASE} ${VARIANT_CLASSES[variant]} ${fullWidth ? "w-full" : ""} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function LinkButton({
  href,
  variant = "primary",
  fullWidth,
  className = "",
  children,
}: CommonProps & { href: string; className?: string }) {
  return (
    <Link href={href} className={`${BASE} ${VARIANT_CLASSES[variant]} ${fullWidth ? "w-full" : ""} ${className}`}>
      {children}
    </Link>
  );
}

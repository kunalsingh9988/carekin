import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

interface CommonProps {
  variant?: Variant;
  fullWidth?: boolean;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-accent text-white",
  secondary: "border border-border text-text-primary",
  danger: "bg-danger text-white",
  ghost: "text-text-secondary",
};

const BASE = "min-h-tap inline-flex items-center justify-center gap-2 rounded-md px-5 text-sm font-semibold disabled:opacity-50 disabled:pointer-events-none";

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

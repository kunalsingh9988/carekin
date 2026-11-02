import type { Config } from "tailwindcss";

// Every value here is a CSS variable reference (see ./tokens.css), never a
// literal hex/px — that's the actual guardrail (Section 2: "don't hardcode
// a hex value or px number in a component"). tokens.css defines the
// variables per color scheme; this file just gives them Tailwind utility
// names (bg-accent, text-accent-text, rounded-md, etc.).
export const tailwindPreset = {
  theme: {
    extend: {
      colors: {
        "bg-canvas": "var(--ck-color-bg-canvas)",
        surface: "var(--ck-color-surface)",
        "surface-secondary": "var(--ck-color-surface-secondary)",
        border: "var(--ck-color-border)",
        "text-primary": "var(--ck-color-text-primary)",
        ink: "var(--ck-color-ink)",
        "text-secondary": "var(--ck-color-text-secondary)",
        accent: "var(--ck-color-accent)",
        "accent-text": "var(--ck-color-accent-text)",
        "accent-tint": "var(--ck-color-accent-tint)",
        verified: "var(--ck-color-verified)",
        highlight: "var(--ck-color-highlight)",
        danger: "var(--ck-color-danger)",
        warning: "var(--ck-color-warning)",
        "success-generic": "var(--ck-color-success-generic)",
      },
      fontFamily: {
        "display-latin": ["var(--ck-font-display-latin)"],
        "display-devanagari": ["var(--ck-font-display-devanagari)"],
        "body-latin": ["var(--ck-font-body-latin)"],
        "body-devanagari": ["var(--ck-font-body-devanagari)"],
      },
      fontSize: {
        xs: "var(--ck-text-xs)",
        sm: "var(--ck-text-sm)",
        base: "var(--ck-text-base)",
        lg: "var(--ck-text-lg)",
        xl: "var(--ck-text-xl)",
        "2xl": "var(--ck-text-2xl)",
        "3xl": "var(--ck-text-3xl)",
        "4xl": "var(--ck-text-4xl)",
        "5xl": "var(--ck-text-5xl)",
      },
      lineHeight: {
        sm: "var(--ck-leading-sm)",
        base: "var(--ck-leading-base)",
        lg: "var(--ck-leading-lg)",
        "3xl": "var(--ck-leading-3xl)",
        "4xl": "var(--ck-leading-4xl)",
        "5xl": "var(--ck-leading-5xl)",
      },
      spacing: {
        "0": "var(--ck-space-0)",
        "1": "var(--ck-space-1)",
        "2": "var(--ck-space-2)",
        "3": "var(--ck-space-3)",
        "4": "var(--ck-space-4)",
        "5": "var(--ck-space-5)",
        "6": "var(--ck-space-6)",
        "8": "var(--ck-space-8)",
        "10": "var(--ck-space-10)",
        "12": "var(--ck-space-12)",
        "16": "var(--ck-space-16)",
        "20": "var(--ck-space-20)",
      },
      borderRadius: {
        sm: "var(--ck-radius-sm)",
        md: "var(--ck-radius-md)",
        lg: "var(--ck-radius-lg)",
        xl: "var(--ck-radius-xl)",
        full: "var(--ck-radius-full)",
      },
      minHeight: {
        tap: "var(--ck-size-min-tap-target)",
      },
      minWidth: {
        tap: "var(--ck-size-min-tap-target)",
      },
    },
  },
} satisfies Partial<Config>;

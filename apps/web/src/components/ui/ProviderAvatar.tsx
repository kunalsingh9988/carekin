// No real photos exist in this prototype — `photo_seed` is just the
// provider's name — so the visual stand-in is an initials monogram. Same
// component everywhere a provider is shown.
export function ProviderAvatar({ name, size = "md" }: { name: string; size?: "md" | "lg" }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  const classes =
    size === "lg"
      ? "h-16 w-16 text-xl"
      : "h-10 w-10 text-sm";
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full bg-accent-tint font-semibold text-accent-text ${classes}`}
    >
      {initials || "?"}
    </span>
  );
}

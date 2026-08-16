export function StepProgress({ step, total, label }: { step: number; total: number; label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
        Step {step} of {total}
      </p>
      <div className="flex gap-1">
        {Array.from({ length: total }).map((_, i) => (
          <span key={i} className={`h-1 flex-1 rounded-full ${i < step ? "bg-accent" : "bg-border"}`} />
        ))}
      </div>
      <p className="sr-only">{label}</p>
    </div>
  );
}

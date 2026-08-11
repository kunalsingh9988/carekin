import type { VerificationStatus } from "@/lib/storage/types";

const STAGES = ["Application submitted", "Documents under review", "Background check", "Approved"];

type StageState = "complete" | "current" | "failed" | "upcoming";

function stageStates(status: VerificationStatus): StageState[] {
  if (status === "approved") return ["complete", "complete", "complete", "complete"];
  if (status === "rejected") return ["complete", "complete", "failed", "upcoming"];
  // pending
  return ["complete", "current", "upcoming", "upcoming"];
}

const DOT_CLASSES: Record<StageState, string> = {
  complete: "bg-verified",
  current: "bg-warning",
  failed: "bg-danger",
  upcoming: "bg-border",
};

// The signature verification-trust element (Section 6) — one component,
// two sizes, reused on the provider verification-status page (full) and
// every provider card in search results (micro).
export function VerificationTrail({ status, size = "full" }: { status: VerificationStatus; size?: "full" | "micro" }) {
  const states = stageStates(status);

  if (size === "micro") {
    return (
      <div className="flex items-center gap-1" aria-label={`Verification: ${status}`}>
        {states.map((state, i) => (
          <span key={i} className={`h-1.5 w-4 rounded-full ${DOT_CLASSES[state]}`} />
        ))}
      </div>
    );
  }

  return (
    <ol className="flex flex-col gap-3">
      {STAGES.map((label, i) => {
        const state = states[i];
        return (
          <li key={label} className="flex items-center gap-3">
            <span className={`h-3 w-3 shrink-0 rounded-full ${DOT_CLASSES[state]}`} />
            <span
              className={
                state === "upcoming"
                  ? "text-sm text-text-secondary"
                  : state === "failed"
                    ? "text-sm font-medium text-danger"
                    : "text-sm font-medium text-text-primary"
              }
            >
              {label}
              {state === "failed" && " — flagged, see notes below"}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

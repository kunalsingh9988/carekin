import { CircleCheck, CircleX, Clock } from "lucide-react";
import type { VerificationStatus } from "@/lib/storage/types";

const CONFIG: Record<VerificationStatus, { label: string; icon: typeof CircleCheck; className: string }> = {
  approved: { label: "Verified", icon: CircleCheck, className: "text-verified" },
  pending: { label: "Under review", icon: Clock, className: "text-text-secondary" },
  rejected: { label: "Not approved", icon: CircleX, className: "text-danger" },
};

// `--verified` (green) is reserved for this exact meaning — never reused
// for a generic "success" state elsewhere in the app (Guardrails, Section 6).
export function VerificationChip({ status }: { status: VerificationStatus }) {
  const { label, icon: Icon, className } = CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${className}`}>
      <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
      {label}
    </span>
  );
}

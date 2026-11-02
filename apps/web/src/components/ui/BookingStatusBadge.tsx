import type { BookingStatus } from "@/lib/storage/types";

const CONFIG: Record<BookingStatus, { label: string; className: string }> = {
  requested: { label: "Requested", className: "bg-surface-secondary text-text-secondary" },
  confirmed: { label: "Confirmed", className: "bg-accent-tint text-accent-text" },
  in_progress: { label: "In progress", className: "bg-accent-tint text-accent-text" },
  completed: { label: "Completed", className: "bg-verified/10 text-verified" },
  cancelled: { label: "Cancelled", className: "bg-surface-secondary text-text-secondary" },
  disputed: { label: "Disputed", className: "bg-danger/10 text-danger" },
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const { label, className } = CONFIG[status];
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}>{label}</span>;
}

import type { BookingStatus } from "@/lib/storage/types";

const CONFIG: Record<BookingStatus, { label: string; className: string }> = {
  requested: { label: "Requested", className: "bg-warning/15 text-warning" },
  confirmed: { label: "Confirmed", className: "bg-success-generic/15 text-success-generic" },
  in_progress: { label: "In progress", className: "bg-success-generic/15 text-success-generic" },
  completed: { label: "Completed", className: "bg-success-generic/15 text-success-generic" },
  cancelled: { label: "Cancelled", className: "bg-border text-text-secondary" },
  disputed: { label: "Disputed", className: "bg-danger/15 text-danger" },
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const { label, className } = CONFIG[status];
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${className}`}>{label}</span>;
}

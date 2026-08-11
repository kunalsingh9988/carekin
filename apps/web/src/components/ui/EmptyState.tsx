import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  body?: string;
  action?: ReactNode;
}

// The one reusable empty state for every list view in the app (Section 4,
// item 30) — no per-page blank-screen one-offs.
export function EmptyState({ icon: Icon, title, body, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-6 py-16 text-center">
      <Icon className="h-10 w-10 text-text-secondary" strokeWidth={1.5} />
      <p className="font-medium text-text-primary">{title}</p>
      {body && <p className="max-w-sm text-sm text-text-secondary">{body}</p>}
      {action}
    </div>
  );
}

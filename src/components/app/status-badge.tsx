import { cn } from "@/lib/utils";

export type StatusBadgeKind =
  | "nosite"
  | "contacted"
  | "replied"
  | "pending"
  | "won"
  | "new"
  | "unaudited";

interface StatusBadgeProps {
  kind: StatusBadgeKind;
  label: string;
  className?: string;
}

export function StatusBadge({ kind, label, className }: StatusBadgeProps) {
  return (
    <span className={cn("lr-status", kind, className)}>
      <span className="lr-status-dot" />
      {label}
    </span>
  );
}

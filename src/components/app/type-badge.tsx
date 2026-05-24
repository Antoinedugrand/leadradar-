import { placeTypeLabel } from "@/lib/i18n";
import type { useLocale } from "@/lib/i18n/locale-provider";
import { cn } from "@/lib/utils";

interface TypeBadgeProps {
  type: string | null | undefined;
  t: ReturnType<typeof useLocale>["t"];
  className?: string;
}

export function TypeBadge({ type, t, className }: TypeBadgeProps) {
  if (!type) return null;

  return (
    <span
      className={cn(
        "inline-flex rounded-md border border-[var(--slate-200)] bg-[var(--slate-50)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--slate-600)]",
        className,
      )}
    >
      {placeTypeLabel(t, type)}
    </span>
  );
}

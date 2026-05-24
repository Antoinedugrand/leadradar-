interface MapMiniStatProps {
  label: string;
  value: number;
  tone?: "default" | "danger" | "hot" | "success";
  compact?: boolean;
}

export function MapMiniStat({ label, value, tone = "default", compact = false }: MapMiniStatProps) {
  const color =
    tone === "danger" || tone === "hot"
      ? "var(--red)"
      : tone === "success"
        ? "var(--emerald)"
        : "var(--slate-900)";

  return (
    <div
      className={
        compact
          ? "min-w-0 rounded-[7px] border border-[var(--slate-100)] bg-[var(--slate-50)] px-1.5 py-1"
          : "rounded-[9px] border border-[var(--slate-100)] bg-[var(--slate-50)] px-2.5 py-2"
      }
    >
      <div
        className={
          compact
            ? "truncate text-[7px] font-semibold uppercase leading-tight tracking-[0.04em] text-[var(--slate-500)]"
            : "text-[9px] font-semibold uppercase tracking-[0.06em] text-[var(--slate-500)]"
        }
        title={label}
      >
        {label}
      </div>
      <div
        className={
          compact
            ? "mt-0.5 text-sm font-bold tabular-nums leading-none"
            : "mt-0.5 text-lg font-bold tabular-nums"
        }
        style={{ fontFamily: "var(--font-display)", color }}
      >
        {value}
      </div>
    </div>
  );
}

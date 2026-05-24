import type { LucideIcon } from "lucide-react";

export type StatCardTone = "default" | "danger" | "warn" | "success";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  delta?: string;
  deltaDir?: "up" | "down";
  tone?: StatCardTone;
}

const toneClass: Record<StatCardTone, string> = {
  default: "",
  danger: "danger",
  warn: "warn",
  success: "success",
};

export function StatCard({
  icon: Icon,
  label,
  value,
  delta,
  deltaDir = "up",
  tone = "default",
}: StatCardProps) {
  return (
    <div className="lr-stat">
      <div className="lr-stat-head">
        <span className={`lr-stat-ico ${toneClass[tone]}`}>
          <Icon size={18} />
        </span>
        <span className="lr-stat-lbl">{label}</span>
      </div>
      <div className="lr-stat-val">{value}</div>
      {delta ? <div className={`lr-stat-delta ${deltaDir}`}>{delta}</div> : null}
    </div>
  );
}

import type { ProspectScoreLabel } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ProspectAvatarProps {
  name: string;
  score?: number | null;
  scoreLabel?: ProspectScoreLabel | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}

function tierFromScore(score: number | null | undefined): ProspectScoreLabel {
  if (score == null) return "hot";
  if (score <= 35) return "hot";
  if (score <= 60) return "warm";
  return "cold";
}

function initialsFromName(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function ProspectAvatar({
  name,
  score,
  scoreLabel,
  className,
  size,
}: ProspectAvatarProps) {
  const tier = scoreLabel ?? tierFromScore(score);

  return (
    <div
      className={cn(
        "lr-avatar",
        tier,
        size === "sm" && "lr-avatar-sm",
        size === "lg" && "lr-avatar-lg",
        className,
      )}
    >
      {initialsFromName(name)}
    </div>
  );
}

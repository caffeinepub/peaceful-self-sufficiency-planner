import { cn } from "@/lib/utils";
import { getScoreLabel } from "../scoring";

interface ScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ScoreBadge({ score, size = "md", className }: ScoreBadgeProps) {
  const colorClass =
    score >= 65
      ? "bg-score-high text-white"
      : score >= 40
        ? "bg-score-mid text-white"
        : "bg-score-low text-white";

  const sizeClass = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-sm px-2 py-0.5",
    lg: "text-base px-3 py-1",
  }[size];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-semibold tabular-nums",
        colorClass,
        sizeClass,
        className,
      )}
    >
      {Math.round(score)}
    </span>
  );
}

interface ScorePillProps {
  score: number;
  label?: string;
  className?: string;
}

export function ScorePill({ score, label, className }: ScorePillProps) {
  const colorClass =
    score >= 65 ? "score-high" : score >= 40 ? "score-mid" : "score-low";

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <span
        className={cn(
          "text-lg font-bold tabular-nums font-display",
          colorClass,
        )}
      >
        {Math.round(score)}
      </span>
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
    </div>
  );
}

export function ScoreStatusBadge({ score }: { score: number }) {
  const label = getScoreLabel(score);
  const colorClass =
    score >= 65
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
      : score >= 40
        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        colorClass,
      )}
    >
      {label}
    </span>
  );
}

import { useEffect, useRef } from "react";
import { getScoreLabel } from "../scoring";

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  className?: string;
}

function getScoreStrokeColor(score: number): string {
  if (score >= 65) return "oklch(0.54 0.12 148)";
  if (score >= 40) return "oklch(0.72 0.14 60)";
  return "oklch(0.6 0.18 25)";
}

function getDarkScoreStrokeColor(score: number): string {
  if (score >= 65) return "oklch(0.65 0.14 148)";
  if (score >= 40) return "oklch(0.75 0.15 65)";
  return "oklch(0.68 0.2 22)";
}

export function ScoreRing({
  score,
  size = 80,
  strokeWidth = 6,
  showLabel = false,
  className = "",
}: ScoreRingProps) {
  const circleRef = useRef<SVGCircleElement>(null);
  const isDark = document.documentElement.classList.contains("dark");

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const targetOffset = circumference - (score / 100) * circumference;

  useEffect(() => {
    if (!circleRef.current) return;
    // Start from full offset (empty), then animate to target
    circleRef.current.style.strokeDashoffset = `${circumference}`;
    const timer = setTimeout(() => {
      if (circleRef.current) {
        circleRef.current.style.strokeDashoffset = `${targetOffset}`;
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [circumference, targetOffset]);

  const strokeColor = isDark
    ? getDarkScoreStrokeColor(score)
    : getScoreStrokeColor(score);

  const trackColor = isDark ? "oklch(0.32 0.025 160)" : "oklch(0.88 0.018 80)";

  return (
    <div
      className={`flex flex-col items-center justify-center ${className}`}
      data-ocid="detail.score_ring"
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="block"
          aria-label={`Score: ${Math.round(score)} out of 100`}
          role="img"
        >
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={trackColor}
            strokeWidth={strokeWidth}
          />
          {/* Score arc */}
          <circle
            ref={circleRef}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={`${circumference}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{
              transition: "stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
          {/* Score text */}
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="central"
            fill={strokeColor}
            style={{
              fontFamily: "Fraunces, serif",
              fontWeight: 700,
              fontSize: size * 0.22,
            }}
          >
            {Math.round(score)}
          </text>
        </svg>
      </div>
      {showLabel && (
        <span className="mt-1 text-xs font-medium text-muted-foreground">
          {getScoreLabel(score)}
        </span>
      )}
    </div>
  );
}

interface MiniScoreRingProps {
  score: number;
  size?: number;
}

export function MiniScoreRing({ score, size = 48 }: MiniScoreRingProps) {
  return (
    <ScoreRing score={score} size={size} strokeWidth={4} showLabel={false} />
  );
}

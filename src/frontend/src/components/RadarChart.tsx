interface RadarChartProps {
  scores: {
    energy: number;
    water: number;
    food: number;
    comfort: number;
    buffers: number;
    land_water: number;
  };
  size?: number;
}

const PILLARS = [
  { key: "energy" as const, label: "Energy", icon: "⚡" },
  { key: "water" as const, label: "Water", icon: "💧" },
  { key: "food" as const, label: "Food", icon: "🌱" },
  { key: "comfort" as const, label: "Comfort", icon: "🏠" },
  { key: "buffers" as const, label: "Buffers", icon: "🔧" },
  { key: "land_water" as const, label: "Land & Water", icon: "🌿" },
];

export function RadarChart({ scores, size = 280 }: RadarChartProps) {
  const center = size / 2;
  const maxRadius = size * 0.35;
  const labelRadius = size * 0.5;
  const numAxes = PILLARS.length;

  // Angles: start at top (-90°), go clockwise
  const angles = PILLARS.map((_, i) => {
    const angle = (i * 2 * Math.PI) / numAxes - Math.PI / 2;
    return angle;
  });

  // Compute polygon points for a given value (0–100)
  function getPoint(angle: number, value: number) {
    const r = (value / 100) * maxRadius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  }

  // Grid rings (25, 50, 75, 100)
  const gridLevels = [25, 50, 75, 100];

  function getRingPoints(level: number) {
    const pts = angles.map((angle) => getPoint(angle, level));
    return pts.map((p) => `${p.x},${p.y}`).join(" ");
  }

  // Data polygon
  const dataPoints = angles.map((angle, i) => {
    const key = PILLARS[i].key;
    const score = scores[key];
    return getPoint(angle, score);
  });
  const dataPolygon = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  // Label positions
  function getLabelPos(angle: number) {
    return {
      x: center + labelRadius * Math.cos(angle),
      y: center + labelRadius * Math.sin(angle),
    };
  }

  const isDark = document.documentElement.classList.contains("dark");

  const gridColor = isDark ? "oklch(0.35 0.025 160)" : "oklch(0.85 0.018 80)";
  const axisColor = isDark ? "oklch(0.42 0.025 160)" : "oklch(0.78 0.018 80)";
  const fillColor = isDark
    ? "oklch(0.62 0.1 148 / 0.18)"
    : "oklch(0.54 0.12 148 / 0.15)";
  const strokeColor = isDark ? "oklch(0.65 0.14 148)" : "oklch(0.48 0.085 150)";
  const dotColor = isDark ? "oklch(0.65 0.14 148)" : "oklch(0.48 0.085 150)";
  const textColor = isDark ? "oklch(0.75 0.02 120)" : "oklch(0.38 0.025 60)";

  return (
    <svg
      width={size}
      height={size}
      viewBox={`-35 -30 ${size + 70} ${size + 60}`}
      className="block"
      role="img"
      aria-label="Radar chart showing pillar scores"
      data-ocid="detail.radar_chart"
    >
      {/* Grid rings */}
      {gridLevels.map((level) => (
        <polygon
          key={level}
          points={getRingPoints(level)}
          fill="none"
          stroke={gridColor}
          strokeWidth={1}
        />
      ))}

      {/* Axis lines */}
      {PILLARS.map((pillar, i) => {
        const outer = getPoint(angles[i], 100);
        return (
          <line
            key={pillar.key}
            x1={center}
            y1={center}
            x2={outer.x}
            y2={outer.y}
            stroke={axisColor}
            strokeWidth={1}
          />
        );
      })}

      {/* Data polygon */}
      <polygon
        points={dataPolygon}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={2}
      />

      {/* Data dots */}
      {dataPoints.map((pt, i) => (
        <circle
          key={PILLARS[i].key}
          cx={pt.x}
          cy={pt.y}
          r={4}
          fill={dotColor}
        />
      ))}

      {/* Labels */}
      {PILLARS.map((pillar, i) => {
        const angle = angles[i];
        const pos = getLabelPos(angle);
        const score = scores[pillar.key];

        // Text anchor based on position
        let textAnchor: "middle" | "end" | "start" = "middle";
        if (pos.x < center - 10) textAnchor = "end";
        else if (pos.x > center + 10) textAnchor = "start";

        return (
          <g key={pillar.key}>
            <text
              x={pos.x}
              y={pos.y - 6}
              textAnchor={textAnchor}
              dominantBaseline="auto"
              style={{
                fontSize: 11,
                fontFamily: "Figtree, system-ui, sans-serif",
                fill: textColor,
                fontWeight: 500,
              }}
            >
              {pillar.icon} {pillar.label}
            </text>
            <text
              x={pos.x}
              y={pos.y + 8}
              textAnchor={textAnchor}
              dominantBaseline="auto"
              style={{
                fontSize: 10,
                fontFamily: "Figtree, system-ui, sans-serif",
                fill: strokeColor,
                fontWeight: 600,
              }}
            >
              {Math.round(score)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

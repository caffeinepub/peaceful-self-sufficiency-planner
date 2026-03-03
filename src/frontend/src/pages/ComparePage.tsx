import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ScoreBadge } from "../components/ScoreBadge";
import { useLocations } from "../hooks/useLocations";
import { computeAllScores } from "../scoring";

const PILLAR_LABELS = [
  { key: "energy" as const, label: "Energy", icon: "⚡" },
  { key: "water" as const, label: "Water", icon: "💧" },
  { key: "food" as const, label: "Food", icon: "🌱" },
  { key: "comfort" as const, label: "Comfort", icon: "🏠" },
  { key: "buffers" as const, label: "Buffers", icon: "🔧" },
];

const BAR_COLORS = [
  "oklch(0.54 0.12 148)",
  "oklch(0.62 0.1 60)",
  "oklch(0.58 0.09 210)",
  "oklch(0.55 0.15 25)",
];

const KEY_INPUTS = [
  {
    label: "Solar (kW)",
    getValue: (
      l: ReturnType<typeof computeAllScores> & {
        loc: import("../types").LocationProfile;
      },
    ) => `${l.loc.energy.solar_kw} kW`,
  },
  {
    label: "Battery (kWh)",
    getValue: (
      l: ReturnType<typeof computeAllScores> & {
        loc: import("../types").LocationProfile;
      },
    ) => `${l.loc.energy.battery_kwh} kWh`,
  },
  {
    label: "Water storage",
    getValue: (
      l: ReturnType<typeof computeAllScores> & {
        loc: import("../types").LocationProfile;
      },
    ) => `${l.loc.water.storage_gallons} gal`,
  },
  {
    label: "Food stored",
    getValue: (
      l: ReturnType<typeof computeAllScores> & {
        loc: import("../types").LocationProfile;
      },
    ) => `${l.loc.food.stored_food_months} mo`,
  },
  {
    label: "Heat source",
    getValue: (
      l: ReturnType<typeof computeAllScores> & {
        loc: import("../types").LocationProfile;
      },
    ) => l.loc.comfort.heat_type,
  },
  {
    label: "Fuel reserve",
    getValue: (
      l: ReturnType<typeof computeAllScores> & {
        loc: import("../types").LocationProfile;
      },
    ) => `${l.loc.buffers.fuel_reserve_days} days`,
  },
];

export function ComparePage() {
  const { locations } = useLocations();
  const [selected, setSelected] = useState<string[]>(
    locations.slice(0, Math.min(2, locations.length)).map((l) => l.id),
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  };

  type ScoreWithLoc = ReturnType<typeof computeAllScores> & {
    loc: import("../types").LocationProfile;
  };

  const selectedData: ScoreWithLoc[] = selected
    .map((id) => {
      const loc = locations.find((l) => l.id === id);
      if (!loc) return null;
      return { ...computeAllScores(loc), loc };
    })
    .filter(Boolean) as ScoreWithLoc[];

  const barData = selectedData.map((d) => ({
    name: d.loc.name.length > 16 ? `${d.loc.name.slice(0, 14)}…` : d.loc.name,
    score: Math.round(d.overall),
    fullName: d.loc.name,
  }));

  const isDark = document.documentElement.classList.contains("dark");
  const gridColor = isDark ? "oklch(0.35 0.025 160)" : "oklch(0.85 0.018 80)";
  const textColor = isDark ? "oklch(0.7 0.02 120)" : "oklch(0.45 0.025 60)";

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-foreground">
          Compare Locations
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Select 2–4 locations to compare side by side.
        </p>
      </div>

      {/* Location selector */}
      <div
        className="bg-card border border-border rounded-xl p-5"
        data-ocid="compare.location_select"
      >
        <h2 className="font-medium text-sm mb-3 text-muted-foreground uppercase tracking-wide">
          Choose locations ({selected.length}/4)
        </h2>
        <div className="flex flex-wrap gap-3">
          {locations.map((loc) => {
            const isSelected = selected.includes(loc.id);
            const isDisabled = !isSelected && selected.length >= 4;
            const checkId = `compare-loc-${loc.id}`;
            return (
              <label
                key={loc.id}
                htmlFor={checkId}
                className={cn(
                  "flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors select-none",
                  isSelected
                    ? "border-primary bg-primary/10"
                    : "border-border bg-accent/20 hover:bg-accent/40",
                  isDisabled && "opacity-50 cursor-not-allowed",
                )}
              >
                <Checkbox
                  id={checkId}
                  checked={isSelected}
                  disabled={isDisabled}
                  onCheckedChange={() => !isDisabled && toggle(loc.id)}
                />
                <span className="text-sm font-medium">{loc.name}</span>
                {loc.state && (
                  <Badge variant="outline" className="text-xs">
                    {loc.state}
                  </Badge>
                )}
              </label>
            );
          })}
        </div>
        {locations.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No locations yet. Add some first!
          </p>
        )}
      </div>

      {/* Need at least 2 */}
      {selectedData.length < 2 ? (
        <div className="text-center py-16 text-muted-foreground">
          <span className="text-4xl mb-3 block">📊</span>
          <p className="font-medium">Select at least 2 locations to compare</p>
        </div>
      ) : (
        <>
          {/* Bar chart */}
          <div
            className="bg-card border border-border rounded-xl p-5"
            data-ocid="compare.bar_chart"
          >
            <h2 className="font-display font-semibold text-base mb-4">
              Overall Score Comparison
            </h2>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barData}
                  margin={{ top: 5, right: 10, bottom: 5, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis
                    dataKey="name"
                    tick={{
                      fontSize: 12,
                      fill: textColor,
                      fontFamily: "Figtree, system-ui",
                    }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{
                      fontSize: 11,
                      fill: textColor,
                      fontFamily: "Figtree, system-ui",
                    }}
                  />
                  <Tooltip
                    formatter={(val, _, props) => [
                      `${val} pts`,
                      props.payload?.fullName || "",
                    ]}
                    contentStyle={{
                      background: isDark
                        ? "oklch(0.21 0.022 160)"
                        : "oklch(0.99 0.005 80)",
                      border: `1px solid ${isDark ? "oklch(0.32 0.025 160)" : "oklch(0.88 0.018 80)"}`,
                      borderRadius: "8px",
                      fontFamily: "Figtree, system-ui",
                      fontSize: 13,
                    }}
                  />
                  <Bar dataKey="score" radius={[6, 6, 0, 0]} maxBarSize={72}>
                    {barData.map((entry, index) => (
                      <Cell
                        key={entry.fullName}
                        fill={BAR_COLORS[index % BAR_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pillar comparison table */}
          <div
            className="bg-card border border-border rounded-xl overflow-hidden"
            data-ocid="compare.pillar_table"
          >
            <div className="p-5 pb-3">
              <h2 className="font-display font-semibold text-base">
                Pillar Breakdown
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-accent/20">
                    <th className="text-left px-5 py-3 font-medium text-muted-foreground w-32">
                      Pillar
                    </th>
                    {selectedData.map((d, i) => (
                      <th
                        key={d.loc.id}
                        className="px-4 py-3 font-medium text-center"
                        style={{ color: BAR_COLORS[i % BAR_COLORS.length] }}
                      >
                        {d.loc.name.length > 14
                          ? `${d.loc.name.slice(0, 12)}…`
                          : d.loc.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PILLAR_LABELS.map(({ key, label, icon }) => {
                    const rowScores = selectedData.map((d) => d[key]);
                    const maxScore = Math.max(...rowScores);
                    const minScore = Math.min(...rowScores);
                    return (
                      <tr
                        key={key}
                        className="border-b border-border last:border-0 hover:bg-accent/10"
                      >
                        <td className="px-5 py-3 font-medium">
                          <span className="flex items-center gap-1.5">
                            {icon} {label}
                          </span>
                        </td>
                        {selectedData.map((d) => {
                          const score = d[key];
                          const isMax =
                            score === maxScore && maxScore !== minScore;
                          const isMin =
                            score === minScore && maxScore !== minScore;
                          return (
                            <td
                              key={d.loc.id}
                              className="px-4 py-3 text-center"
                            >
                              <span
                                className={cn(
                                  "inline-flex items-center justify-center w-12 h-8 rounded-full text-sm font-bold",
                                  isMax &&
                                    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
                                  isMin &&
                                    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
                                  !isMax && !isMin && "text-foreground",
                                )}
                              >
                                {Math.round(score)}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                  {/* Overall row */}
                  <tr className="bg-accent/20">
                    <td className="px-5 py-3 font-semibold font-display">
                      Overall
                    </td>
                    {selectedData.map((d) => (
                      <td key={d.loc.id} className="px-4 py-3 text-center">
                        <ScoreBadge score={d.overall} size="md" />
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Key input diffs */}
          <div
            className="bg-card border border-border rounded-xl p-5"
            data-ocid="compare.diff_panel"
          >
            <h2 className="font-display font-semibold text-base mb-4">
              Key Inputs
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 font-medium text-muted-foreground w-36">
                      Input
                    </th>
                    {selectedData.map((d, i) => (
                      <th
                        key={d.loc.id}
                        className="px-3 py-2 font-medium text-center"
                        style={{ color: BAR_COLORS[i % BAR_COLORS.length] }}
                      >
                        {d.loc.name.length > 14
                          ? `${d.loc.name.slice(0, 12)}…`
                          : d.loc.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {KEY_INPUTS.map(({ label, getValue }) => (
                    <tr
                      key={label}
                      className="border-b border-border last:border-0 hover:bg-accent/10"
                    >
                      <td className="py-2 pr-4 text-muted-foreground font-medium">
                        {label}
                      </td>
                      {selectedData.map((d) => (
                        <td
                          key={d.loc.id}
                          className="px-3 py-2 text-center text-foreground font-medium"
                        >
                          {getValue(d)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

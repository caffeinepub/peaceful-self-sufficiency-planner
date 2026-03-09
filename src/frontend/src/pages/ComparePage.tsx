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
import { computeHeatingCoverage } from "../heatingCalc";
import { DEFAULT_HEATING_FUEL, useLocations } from "../hooks/useLocations";
import { computeAllScores } from "../scoring";
import type { LocationProfile } from "../types";

const PILLAR_LABELS = [
  { key: "energy" as const, label: "Energy", icon: "⚡" },
  { key: "water" as const, label: "Water", icon: "💧" },
  { key: "food" as const, label: "Food", icon: "🌱" },
  { key: "comfort" as const, label: "Comfort", icon: "🏠" },
  { key: "buffers" as const, label: "Buffers", icon: "🔧" },
  { key: "land_water" as const, label: "Land & Water", icon: "🌿" },
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
        loc: LocationProfile;
      },
    ) => `${l.loc.energy.solar_kw} kW`,
  },
  {
    label: "Battery (kWh)",
    getValue: (
      l: ReturnType<typeof computeAllScores> & {
        loc: LocationProfile;
      },
    ) => `${l.loc.energy.battery_kwh} kWh`,
  },
  {
    label: "Water storage",
    getValue: (
      l: ReturnType<typeof computeAllScores> & {
        loc: LocationProfile;
      },
    ) => `${l.loc.water.storage_gallons} gal`,
  },
  {
    label: "Food stored",
    getValue: (
      l: ReturnType<typeof computeAllScores> & {
        loc: LocationProfile;
      },
    ) => `${l.loc.food.stored_food_months} mo`,
  },
  {
    label: "Heat source",
    getValue: (
      l: ReturnType<typeof computeAllScores> & {
        loc: LocationProfile;
      },
    ) => l.loc.comfort.heat_type,
  },
  {
    label: "Fuel reserve",
    getValue: (
      l: ReturnType<typeof computeAllScores> & {
        loc: LocationProfile;
      },
    ) => `${l.loc.buffers.fuel_reserve_days} days`,
  },
  {
    label: "Woods cover",
    getValue: (
      l: ReturnType<typeof computeAllScores> & {
        loc: LocationProfile;
      },
    ) => `${l.loc.land_water.woods_percent}%`,
  },
];

function computeResources(loc: LocationProfile, people: number) {
  const foodDays = loc.food.stored_food_months * 30;
  const waterDays = loc.water.storage_gallons / Math.max(people * 15, 1);
  const batteryDays =
    loc.energy.daily_kwh_use > 0
      ? loc.energy.battery_kwh / loc.energy.daily_kwh_use
      : 0;
  const feedDays = loc.buffers.feed_reserve_days;
  const hf = loc.heating_fuel ?? DEFAULT_HEATING_FUEL;
  const heatDays = computeHeatingCoverage(hf).totalDays;
  return { heatDays, batteryDays, waterDays, foodDays, feedDays };
}

function computeComfortHorizon(res: ReturnType<typeof computeResources>) {
  return Math.min(res.heatDays, res.batteryDays, res.waterDays, res.foodDays);
}

function computeLimitingFactor(
  res: ReturnType<typeof computeResources>,
): string {
  const factors = [
    { label: "Heat", days: res.heatDays },
    { label: "Electricity", days: res.batteryDays },
    { label: "Water", days: res.waterDays },
    { label: "Food", days: res.foodDays },
  ];
  factors.sort((a, b) => a.days - b.days);
  return factors[0].label;
}

type ImprovementResult = {
  resource: string;
  what: string;
  daysGained: number;
};

function computeImprovements(
  loc: LocationProfile,
  people: number,
): ImprovementResult {
  const base = computeResources(loc, people);
  const candidates: ImprovementResult[] = [];

  // +5 kWh battery
  if (loc.energy.daily_kwh_use > 0) {
    const newBattery = (loc.energy.battery_kwh + 5) / loc.energy.daily_kwh_use;
    candidates.push({
      resource: "Electricity",
      what: "+5 kWh battery",
      daysGained: Math.round(newBattery - base.batteryDays),
    });
  }

  // +200 gal water
  const newWater = (loc.water.storage_gallons + 200) / Math.max(people * 15, 1);
  candidates.push({
    resource: "Water",
    what: "+200 gal water storage",
    daysGained: Math.round(newWater - base.waterDays),
  });

  // +3 months food
  candidates.push({
    resource: "Food",
    what: "+3 months food stored",
    daysGained: 90,
  });

  // +1 cord firewood
  const hf = loc.heating_fuel ?? DEFAULT_HEATING_FUEL;
  const baseHeat = computeHeatingCoverage(hf).totalDays;
  const newHeat = computeHeatingCoverage({
    ...hf,
    firewood_cords: hf.firewood_cords + 1,
  }).totalDays;
  candidates.push({
    resource: "Heat",
    what: "+1 cord firewood",
    daysGained: Math.round(newHeat - baseHeat),
  });

  candidates.sort((a, b) => b.daysGained - a.daysGained);
  return candidates[0];
}

function buildKeyDifferences(a: LocationProfile, b: LocationProfile): string[] {
  const diffs: { text: string; magnitude: number }[] = [];

  const solarDiff = a.energy.solar_kw - b.energy.solar_kw;
  if (Math.abs(solarDiff) > 0.5) {
    const higher = solarDiff > 0 ? a.name : b.name;
    diffs.push({
      text: `${higher} has stronger solar capacity`,
      magnitude: Math.abs(solarDiff),
    });
  }

  const battDiff = a.energy.battery_kwh - b.energy.battery_kwh;
  if (Math.abs(battDiff) > 3) {
    const higher = battDiff > 0 ? a.name : b.name;
    diffs.push({
      text: `${higher} has more battery storage`,
      magnitude: Math.abs(battDiff),
    });
  }

  const waterDiff = a.water.storage_gallons - b.water.storage_gallons;
  if (Math.abs(waterDiff) > 50) {
    const higher = waterDiff > 0 ? a.name : b.name;
    diffs.push({
      text: `${higher} has greater water storage`,
      magnitude: Math.abs(waterDiff) / 100,
    });
  }

  const foodDiff = a.food.stored_food_months - b.food.stored_food_months;
  if (Math.abs(foodDiff) > 1) {
    const higher = foodDiff > 0 ? a.name : b.name;
    diffs.push({
      text: `${higher} has more stored food`,
      magnitude: Math.abs(foodDiff),
    });
  }

  const woodsDiff = a.land_water.woods_percent - b.land_water.woods_percent;
  if (Math.abs(woodsDiff) > 15) {
    const higher = woodsDiff > 0 ? a.name : b.name;
    diffs.push({
      text: `${higher} has significantly more woodland`,
      magnitude: Math.abs(woodsDiff) / 10,
    });
  }

  const fuelDiff = a.buffers.fuel_reserve_days - b.buffers.fuel_reserve_days;
  if (Math.abs(fuelDiff) > 5) {
    const higher = fuelDiff > 0 ? a.name : b.name;
    diffs.push({
      text: `${higher} has larger fuel reserves`,
      magnitude: Math.abs(fuelDiff),
    });
  }

  // Natural water access
  const aHasNaturalWater =
    a.land_water.has_surface_water &&
    ["creek", "river"].includes(a.land_water.water_type) &&
    a.land_water.water_reliability === "year_round";
  const bHasNaturalWater =
    b.land_water.has_surface_water &&
    ["creek", "river"].includes(b.land_water.water_type) &&
    b.land_water.water_reliability === "year_round";
  if (aHasNaturalWater && !bHasNaturalWater) {
    diffs.push({
      text: `${a.name} has natural year-round water access`,
      magnitude: 5,
    });
  } else if (bHasNaturalWater && !aHasNaturalWater) {
    diffs.push({
      text: `${b.name} has natural year-round water access`,
      magnitude: 5,
    });
  }

  diffs.sort((x, y) => y.magnitude - x.magnitude);
  return diffs.slice(0, 4).map((d) => d.text);
}

const RESOURCE_ROWS = [
  { key: "heatDays" as const, label: "Heat", icon: "🔥" },
  { key: "batteryDays" as const, label: "Electricity", icon: "⚡" },
  { key: "waterDays" as const, label: "Water", icon: "💧" },
  { key: "foodDays" as const, label: "Food", icon: "🌱" },
  { key: "feedDays" as const, label: "Animal Feed", icon: "🐄" },
];

export function ComparePage() {
  const { locations } = useLocations();
  const [selected, setSelected] = useState<string[]>(
    locations.slice(0, Math.min(2, locations.length)).map((l) => l.id),
  );
  const [people, setPeople] = useState(2);

  const toggle = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  };

  type ScoreWithLoc = ReturnType<typeof computeAllScores> & {
    loc: LocationProfile;
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

  // Derived comparison data
  const bestOverall =
    selectedData.length >= 2
      ? selectedData.reduce(
          (best, d) => (d.overall > best.overall ? d : best),
          selectedData[0],
        )
      : null;

  const strongestPillarPerLocation = selectedData.map((d) => {
    const pillar = PILLAR_LABELS.reduce(
      (best, p) => (d[p.key] > d[best.key] ? p : best),
      PILLAR_LABELS[0],
    );
    return { loc: d.loc, pillar };
  });

  const largestDiff =
    selectedData.length >= 2
      ? PILLAR_LABELS.reduce(
          (maxP, p) => {
            const scores = selectedData.map((d) => d[p.key]);
            const diff = Math.max(...scores) - Math.min(...scores);
            return diff > maxP.diff ? { pillar: p, diff } : maxP;
          },
          { pillar: PILLAR_LABELS[0], diff: -1 },
        )
      : null;

  const resourcesPerLoc = selectedData.map((d) =>
    computeResources(d.loc, people),
  );

  const keyDifferences =
    selectedData.length >= 2
      ? buildKeyDifferences(selectedData[0].loc, selectedData[1].loc)
      : [];

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
          {/* ── Comparison Summary ── */}
          <div
            className="bg-card border border-border rounded-xl p-5"
            data-ocid="compare.summary_card"
          >
            <h2 className="font-display font-semibold text-base mb-4">
              Comparison Summary
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Best overall resilience
                </p>
                <p className="font-semibold text-foreground">
                  {bestOverall?.loc.name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Score: {Math.round(bestOverall?.overall ?? 0)}
                </p>
              </div>
              <div className="bg-accent/30 border border-border rounded-lg p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                  Strongest category
                </p>
                {strongestPillarPerLocation.map(({ loc, pillar }) => (
                  <div key={loc.id} className="flex items-center gap-1.5 mb-1">
                    <span className="text-sm">{pillar.icon}</span>
                    <span className="text-xs font-medium text-foreground">
                      {loc.name.length > 14
                        ? `${loc.name.slice(0, 12)}…`
                        : loc.name}
                      :
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {pillar.label}
                    </span>
                  </div>
                ))}
              </div>
              <div className="bg-accent/30 border border-border rounded-lg p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Largest difference
                </p>
                <p className="font-semibold text-foreground">
                  {largestDiff?.pillar.icon} {largestDiff?.pillar.label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {Math.round(largestDiff?.diff ?? 0)} point gap
                </p>
              </div>
            </div>
          </div>

          {/* ── Bar chart ── */}
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
                      border: `1px solid ${
                        isDark
                          ? "oklch(0.32 0.025 160)"
                          : "oklch(0.88 0.018 80)"
                      }`,
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

          {/* ── Pillar comparison table (enhanced with bars + winner badges) ── */}
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
                        {selectedData.map((d, i) => {
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
                              <div className="flex flex-col items-center gap-1">
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
                                {/* Progress bar */}
                                <div className="w-16 h-1.5 rounded-full bg-border overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all"
                                    style={{
                                      width: `${Math.round(score)}%`,
                                      background:
                                        BAR_COLORS[i % BAR_COLORS.length],
                                    }}
                                  />
                                </div>
                                {isMax && (
                                  <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                                    Best ↑
                                  </span>
                                )}
                              </div>
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

          {/* ── Key Differences ── */}
          {keyDifferences.length > 0 && (
            <div
              className="bg-card border border-border rounded-xl p-5"
              data-ocid="compare.key_differences"
            >
              <h2 className="font-display font-semibold text-base mb-4">
                Key Differences
              </h2>
              <div className="space-y-2">
                {keyDifferences.map((text, i) => (
                  <div
                    // biome-ignore lint/suspicious/noArrayIndexKey: stable list
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-lg bg-accent/20"
                  >
                    <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    <span className="text-sm text-foreground">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Resource Coverage Comparison ── */}
          <div
            className="bg-card border border-border rounded-xl p-5"
            data-ocid="compare.resource_coverage"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-semibold text-base">
                Resource Coverage Duration
              </h2>
              {/* People stepper */}
              <div
                className="flex items-center gap-2"
                data-ocid="compare.people_stepper"
              >
                <span className="text-xs text-muted-foreground">
                  Household:
                </span>
                <button
                  type="button"
                  className="w-8 h-8 rounded-lg border border-border bg-background hover:bg-accent/40 flex items-center justify-center text-sm font-medium transition-colors"
                  onClick={() => setPeople((p) => Math.max(1, p - 1))}
                  aria-label="Decrease people count"
                >
                  −
                </button>
                <span className="w-6 text-center text-sm font-semibold">
                  {people}
                </span>
                <button
                  type="button"
                  className="w-8 h-8 rounded-lg border border-border bg-background hover:bg-accent/40 flex items-center justify-center text-sm font-medium transition-colors"
                  onClick={() => setPeople((p) => Math.min(12, p + 1))}
                  aria-label="Increase people count"
                >
                  +
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {RESOURCE_ROWS.map(({ key, label, icon }) => {
                const vals = resourcesPerLoc.map((r) => r[key]);
                const maxVal = Math.max(...vals);
                return (
                  <div
                    key={key}
                    className="grid gap-2"
                    style={{
                      gridTemplateColumns: `140px repeat(${selectedData.length}, 1fr)`,
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{icon}</span>
                      <span className="text-sm font-medium">{label}</span>
                    </div>
                    {selectedData.map((d, i) => {
                      const days = vals[i];
                      const isHighest = days === maxVal && maxVal > 0;
                      return (
                        <div
                          key={d.loc.id}
                          className={cn(
                            "rounded-lg p-2.5 text-center",
                            isHighest
                              ? "bg-emerald-100 dark:bg-emerald-900/30"
                              : "bg-accent/20",
                          )}
                        >
                          <p
                            className={cn(
                              "text-sm font-bold",
                              isHighest
                                ? "text-emerald-800 dark:text-emerald-300"
                                : "text-foreground",
                            )}
                          >
                            {Math.round(days)} days
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {d.loc.name.length > 12
                              ? `${d.loc.name.slice(0, 10)}…`
                              : d.loc.name}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Comfort Horizon Comparison ── */}
          <div
            className="bg-card border border-border rounded-xl p-5"
            data-ocid="compare.comfort_horizon"
          >
            <h2 className="font-display font-semibold text-base mb-1">
              Comfort Horizon Comparison
            </h2>
            <p className="text-xs text-muted-foreground mb-4">
              Estimated duration before the first resource becomes the limiting
              factor.
            </p>
            <div
              className="grid gap-4"
              style={{
                gridTemplateColumns: `repeat(${selectedData.length}, 1fr)`,
              }}
            >
              {selectedData.map((d, i) => {
                const res = resourcesPerLoc[i];
                const horizon = computeComfortHorizon(res);
                const limiter = computeLimitingFactor(res);
                const allHorizons = resourcesPerLoc.map(computeComfortHorizon);
                const isLeader = horizon === Math.max(...allHorizons);
                return (
                  <div
                    key={d.loc.id}
                    className={cn(
                      "rounded-xl border p-4 text-center",
                      isLeader
                        ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20"
                        : "border-border bg-accent/20",
                    )}
                  >
                    <p
                      className="text-sm font-medium truncate mb-1"
                      title={d.loc.name}
                    >
                      {d.loc.name.length > 18
                        ? `${d.loc.name.slice(0, 16)}…`
                        : d.loc.name}
                    </p>
                    <p
                      className={cn(
                        "text-3xl font-bold font-display mb-1",
                        isLeader
                          ? "text-emerald-700 dark:text-emerald-400"
                          : "text-foreground",
                      )}
                    >
                      {Math.round(horizon)}
                    </p>
                    <p className="text-xs text-muted-foreground">days</p>
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-[11px] text-muted-foreground">
                        Limiting factor
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        {limiter}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Improvement Insights ── */}
          <div
            className="bg-card border border-border rounded-xl p-5"
            data-ocid="compare.improvement_insights"
          >
            <h2 className="font-display font-semibold text-base mb-1">
              Improvement Opportunities
            </h2>
            <p className="text-xs text-muted-foreground mb-4">
              Fastest ways to extend coverage duration for each location.
            </p>
            <div
              className="grid gap-4"
              style={{
                gridTemplateColumns: `repeat(${Math.min(selectedData.length, 2)}, 1fr)`,
              }}
            >
              {selectedData.map((d, i) => {
                const improvement = computeImprovements(d.loc, people);
                return (
                  <div
                    key={d.loc.id}
                    className="bg-accent/20 border border-border rounded-lg p-4"
                  >
                    <p
                      className="text-sm font-semibold mb-3 truncate"
                      style={{ color: BAR_COLORS[i % BAR_COLORS.length] }}
                      title={d.loc.name}
                    >
                      {d.loc.name}
                    </p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                      Fastest improvement
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {improvement.what}
                    </p>
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                        +{improvement.daysGained} {improvement.resource} days
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Key inputs ── */}
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

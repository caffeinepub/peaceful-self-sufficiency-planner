import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { computeHeatingCoverage } from "../heatingCalc";
import { DEFAULT_HEATING_FUEL, useLocations } from "../hooks/useLocations";
import type { LocationProfile } from "../types";

interface ScenarioResource {
  key: string;
  icon: string;
  label: string;
  days: number | "unlimited" | "n/a";
  note?: string;
}

interface Scenario {
  id: string;
  icon: string;
  name: string;
  description: string;
  durationLabel: string;
  thresholdDays: number;
  compute: (loc: LocationProfile, people: number) => ScenarioResource[];
}

function getNumericDays(days: number | "unlimited" | "n/a"): number | null {
  if (days === "unlimited") return null;
  if (days === "n/a") return null;
  return days;
}

function formatDays(days: number | "unlimited" | "n/a"): string {
  if (days === "unlimited") return "Unlimited";
  if (days === "n/a") return "N/A";
  if (days < 1) return "< 1 day";
  const n = Math.round(days);
  return `${n} day${n !== 1 ? "s" : ""}`;
}

function getDayTextColor(days: number | "unlimited" | "n/a"): string {
  if (days === "unlimited" || days === "n/a") return "text-muted-foreground";
  if (days >= 60) return "text-emerald-600 dark:text-emerald-400";
  if (days >= 21) return "text-teal-600 dark:text-teal-400";
  if (days >= 7) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function getDayBarColor(days: number | "unlimited" | "n/a"): string {
  if (days === "unlimited" || days === "n/a") return "bg-muted-foreground/30";
  if (days >= 60) return "bg-emerald-500 dark:bg-emerald-400";
  if (days >= 21) return "bg-teal-500 dark:bg-teal-400";
  if (days >= 7) return "bg-amber-500 dark:bg-amber-400";
  return "bg-red-500 dark:bg-red-400";
}

const MAX_BAR = 90;

function ResourceRow({ resource }: { resource: ScenarioResource }) {
  const { days, icon, label, note } = resource;
  const pct =
    typeof days === "number"
      ? Math.min((days / MAX_BAR) * 100, 100)
      : days === "unlimited"
        ? 100
        : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base shrink-0">{icon}</span>
          <span className="text-sm font-medium text-foreground truncate">
            {label}
          </span>
        </div>
        <span
          className={cn(
            "text-sm font-bold tabular-nums shrink-0",
            getDayTextColor(days),
          )}
        >
          {formatDays(days)}
        </span>
      </div>
      <div className="h-2 rounded-full bg-accent/40 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700",
            getDayBarColor(days),
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      {note && <p className="text-xs text-muted-foreground pl-6">{note}</p>}
    </div>
  );
}

const SCENARIOS: Scenario[] = [
  {
    id: "quiet_week",
    icon: "🛒",
    name: "Quiet Week",
    description:
      "7 days without stores or outside services. Baseline conditions.",
    durationLabel: "7-day window",
    thresholdDays: 7,
    compute(loc, people) {
      const hf = loc.heating_fuel ?? DEFAULT_HEATING_FUEL;
      const heatDays = computeHeatingCoverage(hf).totalDays;
      const isAlwaysOn = ["well", "spring", "city"].includes(
        loc.water.primary_source,
      );
      const waterDays = loc.water.storage_gallons / Math.max(people * 15, 1);
      const foodDays = loc.food.stored_food_months * 30;
      const elecDays =
        loc.energy.daily_kwh_use > 0
          ? loc.energy.battery_kwh / loc.energy.daily_kwh_use
          : 0;
      const feedDays = loc.buffers.feed_reserve_days;
      return [
        {
          key: "heat",
          icon: "🔥",
          label: "Heat",
          days: heatDays,
          note: heatDays >= 7 ? "Sufficient for this scenario" : undefined,
        },
        {
          key: "water",
          icon: "💧",
          label: "Water",
          days: isAlwaysOn ? "unlimited" : waterDays,
          note: isAlwaysOn
            ? "Well/spring/city — effectively continuous"
            : waterDays >= 7
              ? "Sufficient for this scenario"
              : undefined,
        },
        {
          key: "food",
          icon: "🌱",
          label: "Food",
          days: foodDays,
          note: foodDays >= 7 ? "Sufficient for this scenario" : undefined,
        },
        {
          key: "electricity",
          icon: "⚡",
          label: "Electricity",
          days: elecDays,
          note: elecDays >= 7 ? "Sufficient for this scenario" : undefined,
        },
        {
          key: "feed",
          icon: "🐄",
          label: "Animal Feed",
          days: feedDays,
          note: feedDays >= 7 ? "Sufficient for this scenario" : undefined,
        },
      ];
    },
  },
  {
    id: "grid_failure",
    icon: "⚡",
    name: "Grid Power Failure",
    description: "No grid power — battery only, no recharge from grid.",
    durationLabel: "Open-ended outage",
    thresholdDays: 14,
    compute(loc, people) {
      const hf = loc.heating_fuel ?? DEFAULT_HEATING_FUEL;
      const heatDays = computeHeatingCoverage(hf).totalDays;
      const isAlwaysOn = ["well", "spring", "city"].includes(
        loc.water.primary_source,
      );
      const waterDays = loc.water.storage_gallons / Math.max(people * 15, 1);
      const foodDays = loc.food.stored_food_months * 30;
      const elecDays =
        loc.energy.daily_kwh_use > 0
          ? loc.energy.battery_kwh / loc.energy.daily_kwh_use
          : 0;
      const feedDays = loc.buffers.feed_reserve_days;
      return [
        { key: "heat", icon: "🔥", label: "Heat", days: heatDays },
        {
          key: "water",
          icon: "💧",
          label: "Water",
          days: isAlwaysOn ? "unlimited" : waterDays,
          note: isAlwaysOn
            ? "Well/spring/city — available while pump has power"
            : undefined,
        },
        { key: "food", icon: "🌱", label: "Food", days: foodDays },
        {
          key: "electricity",
          icon: "⚡",
          label: "Electricity",
          days: elecDays,
          note: "Battery only — no grid recharge",
        },
        { key: "feed", icon: "🐄", label: "Animal Feed", days: feedDays },
      ];
    },
  },
  {
    id: "winter_storm",
    icon: "❄️",
    name: "Winter Storm Isolation",
    description: "Cold conditions, roads impassable. 14-day planning window.",
    durationLabel: "14-day window",
    thresholdDays: 14,
    compute(loc, people) {
      const hf = loc.heating_fuel ?? DEFAULT_HEATING_FUEL;
      const heatDays = computeHeatingCoverage({
        ...hf,
        winterTempBand: "very_cold",
      }).totalDays;
      const isAlwaysOn = ["well", "spring", "city"].includes(
        loc.water.primary_source,
      );
      const waterDays = loc.water.storage_gallons / Math.max(people * 15, 1);
      const foodDays = loc.food.stored_food_months * 30;
      const solarContrib =
        loc.energy.solar_kw * loc.energy.winter_sun_hours * 0.5 * 14;
      const effectiveBattery = loc.energy.battery_kwh + solarContrib;
      const elecDays =
        loc.energy.daily_kwh_use > 0
          ? effectiveBattery / loc.energy.daily_kwh_use
          : 0;
      const feedDays = loc.buffers.feed_reserve_days;
      return [
        {
          key: "heat",
          icon: "🔥",
          label: "Heat",
          days: heatDays,
          note: "Calculated at very cold conditions",
        },
        {
          key: "water",
          icon: "💧",
          label: "Water",
          days: isAlwaysOn ? "unlimited" : waterDays,
          note: isAlwaysOn ? "Check pipes don't freeze" : undefined,
        },
        { key: "food", icon: "🌱", label: "Food", days: foodDays },
        {
          key: "electricity",
          icon: "⚡",
          label: "Electricity",
          days: elecDays,
          note: "Reduced solar output assumed (50% of normal)",
        },
        { key: "feed", icon: "🐄", label: "Animal Feed", days: feedDays },
      ];
    },
  },
  {
    id: "dry_summer",
    icon: "☀️",
    name: "Dry Summer / Drought",
    description:
      "Extended dry heat. No rainfall. Water reserves under pressure.",
    durationLabel: "14-day window",
    thresholdDays: 14,
    compute(loc, people) {
      const isAlwaysOn = ["well", "spring", "city"].includes(
        loc.water.primary_source,
      );
      let waterStorageGallons = loc.water.storage_gallons;
      let waterNote: string | undefined;
      if (loc.water.primary_source === "rain") {
        waterStorageGallons = waterStorageGallons * 0.5;
        waterNote = "Rainwater collection reduced 50% — drought conditions";
      } else if (isAlwaysOn) {
        waterNote = "Well/spring/city — monitor water table during drought";
      }
      const waterDays = waterStorageGallons / Math.max(people * 15, 1);
      const foodDays = loc.food.stored_food_months * 30;
      const solarContrib =
        loc.energy.solar_kw * loc.energy.winter_sun_hours * 1.5 * 14;
      const effectiveBattery = loc.energy.battery_kwh + solarContrib;
      const elecDays =
        loc.energy.daily_kwh_use > 0
          ? effectiveBattery / loc.energy.daily_kwh_use
          : 0;
      const feedDays = loc.buffers.feed_reserve_days;
      const pastureAcres = loc.land_productivity?.pasture_acres ?? 0;
      const feedNote =
        pastureAcres > 0
          ? "Pasture may be stressed — supplement feed likely needed"
          : undefined;
      return [
        {
          key: "heat",
          icon: "🌡️",
          label: "Heating",
          days: "n/a",
          note: "Not applicable in summer",
        },
        {
          key: "water",
          icon: "💧",
          label: "Water",
          days: isAlwaysOn ? "unlimited" : waterDays,
          note: waterNote,
        },
        { key: "food", icon: "🌱", label: "Food", days: foodDays },
        {
          key: "electricity",
          icon: "⚡",
          label: "Electricity",
          days: elecDays,
          note: "Summer solar boost — extended coverage expected",
        },
        {
          key: "feed",
          icon: "🐄",
          label: "Animal Feed",
          days: feedDays,
          note: feedNote,
        },
      ];
    },
  },
];

function getLimitingFactor(
  resources: ScenarioResource[],
): ScenarioResource | null {
  const numeric = resources.filter(
    (r) => typeof r.days === "number" && r.days > 0,
  );
  if (numeric.length === 0) return null;
  return numeric.reduce((min, r) =>
    (r.days as number) < (min.days as number) ? r : min,
  );
}

function ScenarioCard({
  scenario,
  loc,
  people,
  index,
}: {
  scenario: Scenario;
  loc: LocationProfile;
  people: number;
  index: number;
}) {
  const resources = scenario.compute(loc, people);
  const limiting = getLimitingFactor(resources);
  const allSufficient = resources.every((r) => {
    const d = getNumericDays(r.days);
    return d === null || d >= scenario.thresholdDays;
  });

  return (
    <div
      className="bg-card border border-border rounded-xl overflow-hidden flex flex-col"
      data-ocid={`simulator.scenario.card.${index}`}
    >
      <div className="px-5 pt-4 pb-3 border-b border-border/60 bg-accent/5">
        <div className="flex items-start gap-3">
          <span className="text-2xl shrink-0 mt-0.5">{scenario.icon}</span>
          <div className="min-w-0">
            <h3 className="font-display font-semibold text-base text-foreground leading-tight">
              {scenario.name}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {scenario.description}
            </p>
            <span className="inline-block mt-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full bg-accent/30 text-muted-foreground">
              {scenario.durationLabel}
            </span>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 flex-1 space-y-3">
        {resources.map((r) => (
          <ResourceRow key={r.key} resource={r} />
        ))}
      </div>

      <div className="px-5 pb-4">
        {allSufficient ? (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-sm">✅</span>
            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
              All systems hold for this scenario
            </p>
          </div>
        ) : limiting ? (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <span className="text-sm">⚠️</span>
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
              Limiting factor →{" "}
              <span className="font-bold">{limiting.label}</span>
              {typeof limiting.days === "number" && (
                <span className="font-normal text-muted-foreground">
                  {" "}
                  ({Math.round(limiting.days)} days)
                </span>
              )}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function ScenarioSimulatorPage() {
  const { locations } = useLocations();
  const [locationId, setLocationId] = useState<string>(locations[0]?.id ?? "");
  const [people, setPeople] = useState(2);
  const clampPeople = (n: number) => Math.min(12, Math.max(1, n));

  const loc = locations.find((l) => l.id === locationId);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">🎯</span>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-foreground">
            Scenario Simulator
          </h1>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">
          See how your homestead handles different disruptions. Results are
          advisory only and do not affect your Peaceful Score.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 space-y-1.5">
          <label
            htmlFor="sim-location"
            className="text-sm font-medium text-foreground"
          >
            Location
          </label>
          <Select value={locationId} onValueChange={setLocationId}>
            <SelectTrigger
              id="sim-location"
              className="max-w-xs"
              data-ocid="simulator.location.select"
            >
              <SelectValue placeholder="Choose a location…" />
            </SelectTrigger>
            <SelectContent>
              {locations.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-foreground">People</span>
          <button
            type="button"
            onClick={() => setPeople((p) => clampPeople(p - 1))}
            disabled={people <= 1}
            aria-label="Remove one person"
            className={cn(
              "w-8 h-8 rounded-lg border flex items-center justify-center text-base font-bold transition-colors",
              people <= 1
                ? "border-border text-muted-foreground/40 cursor-not-allowed"
                : "border-border bg-card text-foreground hover:bg-accent/30",
            )}
            data-ocid="simulator.people.decrement_button"
          >
            −
          </button>
          <span
            className="w-8 text-center font-semibold text-lg tabular-nums"
            aria-live="polite"
          >
            {people}
          </span>
          <button
            type="button"
            onClick={() => setPeople((p) => clampPeople(p + 1))}
            disabled={people >= 12}
            aria-label="Add one person"
            className={cn(
              "w-8 h-8 rounded-lg border flex items-center justify-center text-base font-bold transition-colors",
              people >= 12
                ? "border-border text-muted-foreground/40 cursor-not-allowed"
                : "border-border bg-card text-foreground hover:bg-accent/30",
            )}
            data-ocid="simulator.people.increment_button"
          >
            +
          </button>
        </div>
      </div>

      {!loc ? (
        <div
          className="text-center py-16 text-muted-foreground"
          data-ocid="simulator.empty_state"
        >
          <span className="text-4xl mb-3 block">🎯</span>
          <p className="font-medium">Select a location to run scenarios</p>
          <p className="text-sm mt-1">
            Add a location first if you haven&apos;t yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {SCENARIOS.map((scenario, i) => (
            <ScenarioCard
              key={scenario.id}
              scenario={scenario}
              loc={loc}
              people={people}
              index={i + 1}
            />
          ))}
        </div>
      )}

      <div
        className="flex items-start gap-3 p-4 rounded-xl bg-accent/20 border border-border text-sm text-muted-foreground"
        data-ocid="simulator.advisory_note"
      >
        <span className="text-base shrink-0">ℹ️</span>
        <p>
          These scenarios are advisory estimates only. They do not affect your
          Peaceful Score. Actual outcomes depend on weather, usage habits, and
          local conditions. Use these results to identify improvement
          opportunities, not as precise predictions.
        </p>
      </div>
    </div>
  );
}

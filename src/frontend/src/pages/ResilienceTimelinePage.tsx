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

interface Resource {
  key: string;
  icon: string;
  label: string;
  days: number;
  isMajor: boolean; // included in comfort horizon calculation
}

function computeResources(loc: LocationProfile, people: number): Resource[] {
  const { food, water, energy, buffers, heating_fuel } = loc;
  const hf = heating_fuel ?? DEFAULT_HEATING_FUEL;

  const foodDays = food.stored_food_months * 30;

  const waterDays = water.storage_gallons / Math.max(people * 15, 1);

  const batteryDays =
    energy.daily_kwh_use > 0 ? energy.battery_kwh / energy.daily_kwh_use : 0;

  const feedDays = buffers.feed_reserve_days;

  const heatDays = computeHeatingCoverage(hf).totalDays;

  return [
    { key: "heat", icon: "🔥", label: "Heat", days: heatDays, isMajor: true },
    {
      key: "power",
      icon: "⚡",
      label: "Electricity",
      days: batteryDays,
      isMajor: true,
    },
    {
      key: "water",
      icon: "💧",
      label: "Water",
      days: waterDays,
      isMajor: true,
    },
    { key: "food", icon: "🌱", label: "Food", days: foodDays, isMajor: true },
    {
      key: "feed",
      icon: "🐄",
      label: "Animal Feed",
      days: feedDays,
      isMajor: false,
    },
  ];
}

const DAY_BRACKETS = [
  { days: 7, label: "1 wk" },
  { days: 14, label: "2 wk" },
  { days: 30, label: "1 mo" },
  { days: 90, label: "3 mo" },
  { days: 180, label: "6 mo" },
  { days: 365, label: "1 yr" },
];

function getBarColor(days: number): string {
  if (days >= 60) return "bg-emerald-500 dark:bg-emerald-400";
  if (days >= 21) return "bg-teal-500 dark:bg-teal-400";
  if (days >= 7) return "bg-amber-500 dark:bg-amber-400";
  return "bg-red-500 dark:bg-red-400";
}

function getTextColor(days: number): string {
  if (days >= 60) return "text-emerald-600 dark:text-emerald-400";
  if (days >= 21) return "text-teal-600 dark:text-teal-400";
  if (days >= 7) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

const MAX_BAR_DAYS = 365;

function ResourceBar({ resource }: { resource: Resource }) {
  const pct = Math.min((resource.days / MAX_BAR_DAYS) * 100, 100);
  const days = resource.days;
  const formatted =
    days === 0
      ? "0 days"
      : days < 1
        ? "< 1 day"
        : `${Math.round(days)} day${Math.round(days) !== 1 ? "s" : ""}`;

  return (
    <div className="space-y-1.5" data-ocid="timeline.resource.item">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg shrink-0">{resource.icon}</span>
          <span className="text-sm font-medium text-foreground truncate">
            {resource.label}
          </span>
        </div>
        <span
          className={cn(
            "text-sm font-bold tabular-nums shrink-0",
            getTextColor(days),
          )}
        >
          {formatted}
        </span>
      </div>
      <div className="h-3 rounded-full bg-accent/40 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700",
            getBarColor(days),
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function ScaleRuler() {
  return (
    <div className="relative h-5 mt-1 mb-4">
      <div className="absolute inset-x-0 top-2 h-px bg-border" />
      {DAY_BRACKETS.map((b) => {
        const pct = (b.days / MAX_BAR_DAYS) * 100;
        return (
          <div
            key={b.label}
            className="absolute flex flex-col items-center"
            style={{ left: `${pct}%`, transform: "translateX(-50%)" }}
          >
            <div className="w-px h-2 bg-border" />
            <span className="text-[10px] text-muted-foreground/60 mt-0.5">
              {b.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function ResilienceTimelinePage() {
  const { locations } = useLocations();
  const [locationId, setLocationId] = useState<string>(locations[0]?.id ?? "");
  const [people, setPeople] = useState(2);
  const clampPeople = (n: number) => Math.min(12, Math.max(1, n));

  const loc = locations.find((l) => l.id === locationId);
  const resources = loc ? computeResources(loc, people) : null;

  const majorResources = resources?.filter((r) => r.isMajor) ?? [];
  const limitingFactor =
    majorResources.length > 0
      ? majorResources.reduce((min, r) => (r.days < min.days ? r : min))
      : null;
  const comfortHorizon = limitingFactor ? Math.round(limitingFactor.days) : 0;

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Page header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">📊</span>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-foreground">
            Resilience Timeline
          </h1>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">
          See how many days each key resource will last based on your current
          location data.
        </p>
      </div>

      {/* Location selector */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 space-y-1.5">
          <label
            htmlFor="rt-location"
            className="text-sm font-medium text-foreground"
          >
            Location
          </label>
          <Select value={locationId} onValueChange={setLocationId}>
            <SelectTrigger
              id="rt-location"
              className="max-w-xs"
              data-ocid="timeline.location.select"
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

        {/* People stepper */}
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
            data-ocid="timeline.people.decrement_button"
          >
            −
          </button>
          <span
            className="w-8 text-center font-semibold text-lg tabular-nums"
            aria-live="polite"
            aria-label={`${people} ${people === 1 ? "person" : "people"}`}
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
            data-ocid="timeline.people.increment_button"
          >
            +
          </button>
        </div>
      </div>

      {!loc || !resources ? (
        <div
          className="text-center py-16 text-muted-foreground"
          data-ocid="timeline.empty_state"
        >
          <span className="text-4xl mb-3 block">📊</span>
          <p className="font-medium">Select a location to see your timeline</p>
          <p className="text-sm mt-1">
            Add a location first if you haven&apos;t yet.
          </p>
        </div>
      ) : (
        <>
          {/* Insight summary */}
          <div
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            data-ocid="timeline.insights_panel"
          >
            <div className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
              <span className="text-2xl shrink-0">⚠️</span>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                  Limiting factor
                </p>
                {limitingFactor ? (
                  <>
                    <p className="font-display text-lg font-bold text-foreground mt-0.5">
                      {limitingFactor.icon} {limitingFactor.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {Math.round(limitingFactor.days)} days available
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">—</p>
                )}
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
              <span className="text-2xl shrink-0">🌅</span>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                  Comfort horizon
                </p>
                <p
                  className={cn(
                    "font-display text-3xl font-bold mt-0.5 tabular-nums",
                    getTextColor(comfortHorizon),
                  )}
                >
                  {comfortHorizon}{" "}
                  <span className="text-base font-normal text-muted-foreground">
                    days
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Shortest major resource duration
                </p>
              </div>
            </div>
          </div>

          {/* Resource bars */}
          <div
            className="bg-card border border-border rounded-xl p-5 space-y-5"
            data-ocid="timeline.bars_panel"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display font-semibold text-base">
                Resource Coverage
              </h2>
              <span className="text-xs text-muted-foreground">
                {people} {people === 1 ? "person" : "people"}
              </span>
            </div>

            <div className="space-y-4">
              {resources.map((r) => (
                <ResourceBar key={r.key} resource={r} />
              ))}
            </div>

            <ScaleRuler />
          </div>

          {/* Detail table */}
          <div
            className="bg-card border border-border rounded-xl overflow-hidden"
            data-ocid="timeline.detail_table"
          >
            <div className="px-5 py-3 border-b border-border bg-accent/10">
              <h2 className="font-display font-semibold text-sm">
                Coverage Detail
              </h2>
            </div>
            <div className="divide-y divide-border">
              {resources.map((r) => (
                <div
                  key={r.key}
                  className="flex items-center justify-between px-5 py-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{r.icon}</span>
                    <span className="text-sm font-medium text-foreground">
                      {r.label}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "text-sm font-bold tabular-nums",
                      getTextColor(r.days),
                    )}
                  >
                    {r.days < 1 && r.days > 0
                      ? "< 1 day"
                      : `${Math.round(r.days)} days`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Advisory note */}
          <div
            className="flex items-start gap-3 p-4 rounded-xl bg-accent/20 border border-border text-sm text-muted-foreground"
            data-ocid="timeline.advisory_note"
          >
            <span className="text-base shrink-0">ℹ️</span>
            <p>
              These estimates are advisory and depend on weather, stove
              efficiency, and usage habits. Actual durations will vary based on
              real conditions.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

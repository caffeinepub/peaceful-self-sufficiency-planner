import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { DEFAULT_HEATING_FUEL, useLocations } from "../hooks/useLocations";
import { type WinterResource, computeWinterResult } from "../scoring";
import type {
  HeatingFuelData,
  InsulationLevel,
  SnowDisruption,
  WinterTempBand,
} from "../types";

const WINTER_TEMP_OPTIONS: {
  value: WinterTempBand;
  label: string;
  mult: number;
}[] = [
  { value: "mild", label: "Mild (35–45°F)", mult: 0.8 },
  { value: "cool", label: "Cool (25–35°F)", mult: 1.0 },
  { value: "cold", label: "Cold (15–25°F)", mult: 1.2 },
  { value: "very_cold", label: "Very cold (<15°F)", mult: 1.4 },
];

const SNOW_OPTIONS: { value: SnowDisruption; label: string }[] = [
  { value: "rare", label: "Rare" },
  { value: "occasional", label: "Occasional" },
  { value: "regular", label: "Regular" },
  { value: "heavy", label: "Heavy" },
];

const WINTER_TEMP_MULT: Record<WinterTempBand, number> = {
  mild: 0.8,
  cool: 1.0,
  cold: 1.2,
  very_cold: 1.4,
};

function getTempMult(band: WinterTempBand): number {
  return WINTER_TEMP_MULT[band];
}

function accessNote(snow: SnowDisruption, days: number): string {
  const mult =
    snow === "heavy"
      ? 1.3
      : snow === "regular"
        ? 1.15
        : snow === "rare"
          ? 0.9
          : 1.0;
  const effective = days * mult;
  if (effective <= 7) return "Access likely manageable with basic prep.";
  if (effective <= 14) return "Plan for delays and fewer resupply options.";
  return "Deep reserves recommended during extended winter disruption.";
}

type ScenarioDuration = 7 | 14 | 30;

const insulationMult: Record<InsulationLevel, number> = {
  poor: 1.35,
  average: 1.0,
  good: 0.8,
  excellent: 0.65,
};

function computeWoodEstimates(
  fuel: HeatingFuelData,
  duration: ScenarioDuration,
  tempMult: number,
) {
  const baseWoodMonthly =
    fuel.heating_priority === "whole_house"
      ? fuel.heated_sqft / 1200
      : fuel.heating_priority === "living_area"
        ? 0.6
        : 0.3;

  const role = fuel.firewood_role ?? "primary";
  const woodShare =
    role === "primary"
      ? 1.0
      : role === "secondary"
        ? (fuel.wood_share ?? 0.4)
        : 0.15;

  const cordsNeeded =
    baseWoodMonthly *
    insulationMult[fuel.insulation_level] *
    (duration / 30) *
    tempMult *
    woodShare;
  const woodPct =
    cordsNeeded > 0 ? (fuel.firewood_cords / cordsNeeded) * 100 : 200;
  return { cordsNeeded, woodPct, woodShare };
}

function computePropaneEstimates(
  fuel: HeatingFuelData,
  duration: ScenarioDuration,
  tempMult: number,
  woodShare: number,
) {
  const tankGallons =
    fuel.propane_tank_preset === "custom"
      ? fuel.propane_custom_gallons
      : fuel.propane_tank_preset;
  const usablePropaneGallons = tankGallons * (fuel.propane_fill_percent / 100);

  // Propane only covers the heating share NOT handled by wood
  const propaneHeatShare = fuel.propane_uses_heating ? 1 - woodShare : 0;
  const baseHeatingDailyGal =
    (fuel.heated_sqft / 1200) * insulationMult[fuel.insulation_level];
  const heatingDailyGal = baseHeatingDailyGal * tempMult * propaneHeatShare;
  const cookingDailyGal = fuel.propane_uses_cooking ? 0.15 : 0;
  const waterHeaterDailyGal = fuel.propane_uses_water_heater ? 0.25 : 0;
  const generatorDailyGal = fuel.propane_uses_generator ? 0.5 : 0;
  const totalDailyPropane =
    heatingDailyGal + cookingDailyGal + waterHeaterDailyGal + generatorDailyGal;
  const propaneNeeded = totalDailyPropane * duration;
  const propanePct =
    propaneNeeded > 0 ? (usablePropaneGallons / propaneNeeded) * 100 : 200;

  return { usablePropaneGallons, propaneNeeded, propanePct };
}

function fuelGaugeLabel(pct: number): "Covered" | "Tight" | "Short" {
  if (pct > 120) return "Covered";
  if (pct >= 80) return "Tight";
  return "Short";
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function WinterScoreRing({ score }: { score: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const strokeColor =
    score >= 70
      ? "stroke-teal-400"
      : score >= 45
        ? "stroke-amber-400"
        : "stroke-red-400";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width="130"
        height="130"
        viewBox="0 0 130 130"
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx="65"
          cy="65"
          r={radius}
          fill="none"
          strokeWidth="10"
          className="stroke-white/10"
        />
        <circle
          cx="65"
          cy="65"
          r={radius}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn("transition-all duration-1000", strokeColor)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-white tabular-nums leading-none">
          {score}
        </span>
        <span className="text-xs text-white/60 mt-0.5">/ 100</span>
      </div>
    </div>
  );
}

function WinterLabelBadge({ label }: { label: string }) {
  const styles =
    label === "Calm Through Winter"
      ? "bg-teal-500/20 text-teal-200 border-teal-500/30"
      : label === "Manageable"
        ? "bg-amber-500/20 text-amber-200 border-amber-500/30"
        : "bg-red-500/20 text-red-200 border-red-500/30";

  const icon =
    label === "Calm Through Winter" ? "❄️" : label === "Manageable" ? "🌨️" : "⛈️";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border",
        styles,
      )}
      data-ocid="winter.winter_label"
    >
      {icon} {label}
    </span>
  );
}

function WinterResourceCard({
  resource,
  index,
}: {
  resource: WinterResource;
  index: number;
}) {
  const ratio = Math.min(resource.days / resource.scenarioDays, 1);
  const pct = Math.round(ratio * 100);

  const covered = resource.covered;
  const statusColor = covered
    ? "text-teal-600 dark:text-teal-400"
    : "text-red-600 dark:text-red-400";
  const barColor = covered
    ? "bg-teal-500 dark:bg-teal-400"
    : "bg-red-500 dark:bg-red-400";

  return (
    <div
      className="bg-card border border-border rounded-xl p-4 space-y-3"
      data-ocid={`winter.resource.item.${index}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{resource.icon}</span>
          <span className="font-medium text-sm">{resource.label}</span>
        </div>
        <span className={cn("text-xs font-semibold", statusColor)}>
          {covered ? "✓ Covered" : "✗ Needs attention"}
        </span>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{resource.days.toFixed(1)} days available</span>
          <span>{resource.scenarioDays} days needed</span>
        </div>
        <div className="h-2 rounded-full bg-accent/40 overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-700",
              barColor,
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {resource.note && (
        <p className="text-xs text-muted-foreground/80 italic">
          {resource.note}
        </p>
      )}
    </div>
  );
}

interface FuelGaugeProps {
  label: string;
  icon: string;
  available: number;
  needed: number;
  unit: string;
  pct: number;
  ocid: string;
}

function FuelGauge({
  label,
  icon,
  available,
  needed,
  unit,
  pct,
  ocid,
}: FuelGaugeProps) {
  const status = fuelGaugeLabel(pct);
  const clampedPct = Math.min(pct, 200);
  const barWidthPct = Math.min(clampedPct / 2, 100); // scale 0–200% → 0–100% bar

  const statusStyles =
    status === "Covered"
      ? {
          badge:
            "bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30",
          bar: "bg-teal-500 dark:bg-teal-400",
        }
      : status === "Tight"
        ? {
            badge:
              "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
            bar: "bg-amber-500 dark:bg-amber-400",
          }
        : {
            badge:
              "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
            bar: "bg-red-500 dark:bg-red-400",
          };

  const statusIcon =
    status === "Covered" ? "✓" : status === "Tight" ? "~" : "✗";

  return (
    <div
      className="bg-card border border-border rounded-xl p-4 space-y-3"
      data-ocid={ocid}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <span className="font-medium text-sm">{label}</span>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border",
            statusStyles.badge,
          )}
        >
          {statusIcon} {status}
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            {available.toFixed(1)} {unit} on hand
          </span>
          <span>
            {needed > 0
              ? `${needed.toFixed(1)} ${unit} needed`
              : "No usage selected"}
          </span>
        </div>
        <div className="h-2.5 rounded-full bg-accent/40 overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-700",
              statusStyles.bar,
            )}
            style={{ width: `${barWidthPct}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground/70 text-right tabular-nums">
          {needed > 0 ? `${Math.round(clampedPct)}% of need covered` : "—"}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

function buildWinterAssumptions(duration: ScenarioDuration) {
  const lowSolarDays = Math.min(5, Math.ceil(duration * 0.35));
  const energyIncrease = duration <= 7 ? 10 : 15;
  const caloricIncrease = duration <= 7 ? 10 : 15;

  return [
    { icon: "🚫", label: `${duration}-day no road access` },
    { icon: "☁️", label: `${lowSolarDays} low-solar days` },
    { icon: "🔥", label: `+${caloricIncrease}% caloric demand` },
    { icon: "⛽", label: "No fuel delivery" },
    { icon: "🧊", label: "Freezing temperatures" },
    { icon: "💡", label: `+${energyIncrease}% energy use` },
  ];
}

export function WinterLockdownPage() {
  const { locations } = useLocations();
  const [locationId, setLocationId] = useState<string>(locations[0]?.id ?? "");
  const [people, setPeople] = useState<number>(1);
  const [scenarioDuration, setScenarioDuration] =
    useState<ScenarioDuration>(14);

  const loc = locations.find((l) => l.id === locationId);
  const clampPeople = (n: number) => Math.min(12, Math.max(1, n));

  // Winter condition overrides — default from location's heating_fuel, but override-able per simulation
  const [tempBand, setTempBand] = useState<WinterTempBand>(
    loc?.heating_fuel?.winterTempBand ?? loc?.winterTempBand ?? "cool",
  );
  const [snowDisruption, setSnowDisruption] = useState<SnowDisruption>(
    loc?.heating_fuel?.snowDisruption ?? loc?.snowDisruption ?? "occasional",
  );

  const heatingFuel: HeatingFuelData =
    loc?.heating_fuel ?? DEFAULT_HEATING_FUEL;

  const result = loc ? computeWinterResult(loc, people) : null;

  const labelExplanation =
    result?.winterLabel === "Calm Through Winter"
      ? "Your homestead is well-equipped to weather this winter access delay with confidence."
      : result?.winterLabel === "Manageable"
        ? "You can get through, but some resources will be stretched. Focus on your weakest buffer."
        : "This winter scenario would be tough on your current setup. Prioritize food, fuel, and battery storage.";

  const tempMult = getTempMult(tempBand);
  const snowNote = accessNote(snowDisruption, scenarioDuration);

  // Fuel estimates
  const { cordsNeeded, woodPct, woodShare } = computeWoodEstimates(
    heatingFuel,
    scenarioDuration,
    tempMult,
  );
  const { usablePropaneGallons, propaneNeeded, propanePct } =
    computePropaneEstimates(heatingFuel, scenarioDuration, tempMult, woodShare);

  const winterAssumptions = buildWinterAssumptions(scenarioDuration);

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Page header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">❄️</span>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-foreground">
            Winter Access Delay
          </h1>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">
          Simulate a winter period with no road access, freezing temperatures,
          reduced solar, and increased household demands.
        </p>
      </div>

      {/* Scenario duration selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm font-medium text-muted-foreground">
          Scenario duration:
        </span>
        <div className="flex gap-1 bg-accent/30 rounded-lg p-1">
          {([7, 14, 30] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setScenarioDuration(d)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                scenarioDuration === d
                  ? "bg-card shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
              data-ocid={`winter.duration.${d}`}
              aria-pressed={scenarioDuration === d}
            >
              {d} days
            </button>
          ))}
        </div>
      </div>

      {/* Winter assumption chips */}
      <div className="flex flex-wrap gap-2">
        {winterAssumptions.map((a) => (
          <span
            key={a.label}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
              bg-blue-950/60 dark:bg-blue-950/80 text-blue-200 border border-blue-800/50
              backdrop-blur-sm shadow-sm"
          >
            {a.icon} {a.label}
          </span>
        ))}
      </div>

      {/* Location selector */}
      <div className="space-y-1.5">
        <label htmlFor="winter-location-select" className="text-sm font-medium">
          Location
        </label>
        <Select value={locationId} onValueChange={setLocationId}>
          <SelectTrigger
            id="winter-location-select"
            data-ocid="winter.location_select"
            className="max-w-xs"
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

      {/* Winter Conditions */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-4">
        <p className="text-sm font-medium text-foreground">Winter Conditions</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label
              htmlFor="winter-temp-band"
              className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
            >
              Temperature band
            </label>
            <Select
              value={tempBand}
              onValueChange={(v) => setTempBand(v as WinterTempBand)}
            >
              <SelectTrigger
                id="winter-temp-band"
                data-ocid="winter.temp_band.select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WINTER_TEMP_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="winter-snow"
              className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
            >
              Snow / road disruption
            </label>
            <Select
              value={snowDisruption}
              onValueChange={(v) => setSnowDisruption(v as SnowDisruption)}
            >
              <SelectTrigger
                id="winter-snow"
                data-ocid="winter.snow_disruption.select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SNOW_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="text-xs text-muted-foreground italic">{snowNote}</p>
      </div>

      {/* People stepper */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">
            How many people are you planning for?
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Scales food and water estimates. Caloric demand also increases in
            winter.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
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
            data-ocid="winter.people.decrement_button"
          >
            −
          </button>
          <span
            className="w-8 text-center font-semibold text-lg tabular-nums"
            data-ocid="winter.people_input"
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
            data-ocid="winter.people.increment_button"
          >
            +
          </button>
        </div>
      </div>

      {!loc || !result ? (
        <div className="text-center py-16 text-muted-foreground">
          <span className="text-4xl mb-3 block">❄️</span>
          <p className="font-medium">Select a location to run the simulation</p>
          <p className="text-sm mt-1">
            Add locations first if you haven&apos;t yet.
          </p>
        </div>
      ) : (
        <>
          {/* Winter Score card */}
          <div
            className="rounded-xl overflow-hidden border border-blue-900/40"
            data-ocid="winter.score_panel"
          >
            {/* Dark header with score ring */}
            <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 p-6 flex flex-col sm:flex-row items-center gap-6">
              <WinterScoreRing score={result.winterScore} />
              <div className="flex-1 text-center sm:text-left space-y-2">
                <div className="text-white/60 text-xs font-medium uppercase tracking-widest">
                  Winter Score — {loc.name}
                </div>
                <WinterLabelBadge label={result.winterLabel} />
                <p className="text-white/70 text-sm leading-relaxed mt-2">
                  {labelExplanation}
                </p>
              </div>
            </div>
          </div>

          {/* Calm Days card */}
          <div
            className="bg-card border border-border rounded-xl p-5 flex items-start gap-4"
            data-ocid="winter.calm_days_panel"
          >
            <div className="text-4xl shrink-0" aria-hidden="true">
              {result.calmDays >= scenarioDuration
                ? "🌨️"
                : result.calmDays >= scenarioDuration / 2
                  ? "🌥️"
                  : "⛈️"}
            </div>
            <div>
              <div className="text-sm text-muted-foreground font-medium uppercase tracking-wide">
                Estimated Calm Days
              </div>
              <div className="font-display text-3xl font-bold text-foreground mt-0.5">
                {result.calmDays}{" "}
                <span className="text-base font-normal text-muted-foreground">
                  days
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Based on your lowest buffer across food, water, energy, and
                fuel. A {scenarioDuration}-day access delay requires all four to
                stay covered.
              </p>
              {/* Limiting factor call-out */}
              {(() => {
                const limitingFactor = result.resources.reduce((min, r) =>
                  r.days < min.days ? r : min,
                );
                return (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 font-medium">
                    Limiting factor: {limitingFactor.icon}{" "}
                    {limitingFactor.label.split("(")[0].trim()} (
                    {limitingFactor.days.toFixed(1)} days)
                  </p>
                );
              })()}
            </div>
          </div>

          {/* Resource breakdown */}
          <div>
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Resource Breakdown
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {result.resources.map((r, i) => (
                <WinterResourceCard key={r.label} resource={r} index={i + 1} />
              ))}
            </div>
          </div>

          {/* Fuel Coverage Estimates */}
          <div>
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Fuel Coverage Estimates
            </h2>
            <p className="text-xs text-muted-foreground mb-3">
              Based on heating fuel &amp; house context entered in the Location
              edit page.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FuelGauge
                label="Firewood Coverage"
                icon="🪵"
                available={heatingFuel.firewood_cords}
                needed={cordsNeeded}
                unit="cords"
                pct={woodPct}
                ocid="winter.fuel.wood_gauge"
              />
              <FuelGauge
                label="Propane Coverage"
                icon="🛢️"
                available={usablePropaneGallons}
                needed={propaneNeeded}
                unit="gal"
                pct={propanePct}
                ocid="winter.fuel.propane_gauge"
              />
            </div>
          </div>

          {/* Winter scoring factors note */}
          <div
            className="bg-blue-950/20 dark:bg-blue-950/40 border border-blue-900/30 rounded-xl p-5 text-sm space-y-3"
            data-ocid="winter.note_panel"
          >
            <p className="font-semibold text-foreground flex items-center gap-2">
              <span>❄️</span> How the Winter Score is calculated
            </p>
            <ul className="text-muted-foreground space-y-1.5 text-xs list-none">
              <li>
                <span className="font-medium text-foreground">
                  Battery autonomy
                </span>{" "}
                — up to 60 pts based on days of energy coverage at
                winter-adjusted usage
              </li>
              <li>
                <span className="font-medium text-foreground">Heat source</span>{" "}
                — wood heat +20, mixed +10, propane +5, electric-only −15
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Water delivery
                </span>{" "}
                — gravity-fed +15, pump-only −15 (pipes can freeze)
              </li>
              <li>
                <span className="font-medium text-foreground">Fuel buffer</span>{" "}
                — up to 20 pts; targets 28 days (doubled importance)
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Food reserves
                </span>{" "}
                — up to 70 pts for 6+ months stored; root cellar +5 bonus
              </li>
            </ul>
            <p className="text-xs text-muted-foreground/70 border-t border-blue-900/20 pt-3">
              Winter simulation assumes {scenarioDuration} days no road access,{" "}
              {Math.min(5, Math.ceil(scenarioDuration * 0.35))} low-solar days
              (solar reduced 40%), {scenarioDuration <= 7 ? 10 : 15}% increased
              energy use, {scenarioDuration <= 7 ? 10 : 15}% increased caloric
              demand, and no fuel delivery. Use as a planning guide, not a
              guarantee.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

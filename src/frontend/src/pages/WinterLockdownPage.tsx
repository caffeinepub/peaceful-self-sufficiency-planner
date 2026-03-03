import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useLocations } from "../hooks/useLocations";
import { type WinterResource, computeWinterResult } from "../scoring";

const WINTER_ASSUMPTIONS = [
  { icon: "🚫", label: "14-day no road access" },
  { icon: "☁️", label: "5 low-solar days" },
  { icon: "🔥", label: "+15% caloric demand" },
  { icon: "⛽", label: "No fuel delivery" },
  { icon: "🧊", label: "Freezing temperatures" },
];

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
          {covered ? "✓ Covered" : "✗ At risk"}
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

export function WinterLockdownPage() {
  const { locations } = useLocations();
  const [locationId, setLocationId] = useState<string>(locations[0]?.id ?? "");
  const [people, setPeople] = useState<number>(1);

  const loc = locations.find((l) => l.id === locationId);
  const clampPeople = (n: number) => Math.min(12, Math.max(1, n));

  const result = loc ? computeWinterResult(loc, people) : null;

  const labelExplanation =
    result?.winterLabel === "Calm Through Winter"
      ? "Your homestead is well-equipped to weather a 14-day winter lockdown with confidence."
      : result?.winterLabel === "Manageable"
        ? "You can get through, but some resources will be stretched. Focus on your weakest buffer."
        : "This winter scenario would be tough on your current setup. Prioritize food, fuel, and battery storage.";

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Page header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">❄️</span>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-foreground">
            Winter Lockdown Mode
          </h1>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">
          Simulate 14 days of no road access with freezing temperatures, reduced
          solar, and increased household demands.
        </p>
      </div>

      {/* Winter assumption chips */}
      <div className="flex flex-wrap gap-2">
        {WINTER_ASSUMPTIONS.map((a) => (
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

      {/* People stepper */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">
            How many people are you planning for?
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Scales food and water estimates. Caloric demand also increases +15%
            per person in winter.
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
              {result.calmDays >= 14 ? "🌨️" : result.calmDays >= 7 ? "🌥️" : "⛈️"}
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
                fuel. A 14-day lockdown requires all four to stay covered.
              </p>
              {/* Bottleneck call-out */}
              {(() => {
                const bottleneck = result.resources.reduce((min, r) =>
                  r.days < min.days ? r : min,
                );
                return (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 font-medium">
                    Bottleneck: {bottleneck.icon}{" "}
                    {bottleneck.label.split("(")[0].trim()} (
                    {bottleneck.days.toFixed(1)} days)
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
              Winter simulation assumes 14 days no road access, 5 low-solar days
              (solar reduced 40%), 15% increased energy use, 15% increased
              caloric demand, and no fuel delivery. Use as a planning guide, not
              a guarantee.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

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

interface Scenario {
  id: string;
  label: string;
  days: number;
  description: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: "3-day-outage",
    label: "3-Day Outage",
    days: 3,
    description: "Power goes out — how does your homestead hold up for 3 days?",
  },
  {
    id: "7-day-icy",
    label: "7-Day Icy Roads",
    days: 7,
    description:
      "A week of winter weather keeps you home. Are you comfortable?",
  },
  {
    id: "14-day-delay",
    label: "14-Day Supply Delay",
    days: 14,
    description:
      "Two weeks of supply chain disruption. What's your comfort level?",
  },
];

interface ResourceStatus {
  label: string;
  icon: string;
  days: number;
  scenarioDays: number;
  covered: boolean;
}

function getResourceMessage(days: number, scenarioDays: number): string {
  if (days >= scenarioDays * 1.5)
    return "Comfortably covered — you have plenty of buffer";
  if (days >= scenarioDays) return "Well covered for this timeframe";
  if (days >= scenarioDays * 0.7) return "Covered, with a little room to spare";
  if (days >= scenarioDays * 0.5)
    return "Could use a bit more for peace of mind";
  return "Worth building up over time";
}

function ResourceCard({ resource }: { resource: ResourceStatus }) {
  const ratio = Math.min(resource.days / resource.scenarioDays, 1);
  const progressWidth = `${Math.round(ratio * 100)}%`;

  const statusColor = resource.covered
    ? "text-emerald-700 dark:text-emerald-300"
    : "text-amber-700 dark:text-amber-300";

  const barColor = resource.covered ? "bg-score-high" : "bg-score-mid";

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{resource.icon}</span>
          <span className="font-medium text-sm">{resource.label}</span>
        </div>
        <span className={cn("text-xs font-semibold", statusColor)}>
          {resource.covered ? "✓ Covered" : "→ Worth building"}
        </span>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{resource.days.toFixed(0)} days available</span>
          <span>{resource.scenarioDays} days needed</span>
        </div>
        <div className="h-2 rounded-full bg-accent/40 overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-700",
              barColor,
            )}
            style={{ width: progressWidth }}
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {getResourceMessage(resource.days, resource.scenarioDays)}
      </p>
    </div>
  );
}

export function QuietWeekPage() {
  const { locations } = useLocations();
  const [locationId, setLocationId] = useState<string>(locations[0]?.id ?? "");
  const [scenarioId, setScenarioId] = useState<string>(SCENARIOS[0].id);

  const loc = locations.find((l) => l.id === locationId);
  const scenario = SCENARIOS.find((s) => s.id === scenarioId) ?? SCENARIOS[0];

  // Compute resource days
  const resources: ResourceStatus[] = loc
    ? [
        {
          label: "Food supply",
          icon: "🌱",
          days: loc.food.stored_food_months * 30,
          scenarioDays: scenario.days,
          covered: loc.food.stored_food_months * 30 >= scenario.days,
        },
        {
          label: "Water supply",
          icon: "💧",
          days: loc.water.storage_gallons / 15,
          scenarioDays: scenario.days,
          covered: loc.water.storage_gallons / 15 >= scenario.days,
        },
        {
          label: "Energy reserve",
          icon: "⚡",
          days: loc.energy.battery_kwh / Math.max(loc.energy.daily_kwh_use, 1),
          scenarioDays: scenario.days,
          covered:
            loc.energy.battery_kwh / Math.max(loc.energy.daily_kwh_use, 1) >=
            scenario.days,
        },
        {
          label: "Fuel reserve",
          icon: "🔧",
          days: loc.buffers.fuel_reserve_days,
          scenarioDays: scenario.days,
          covered: loc.buffers.fuel_reserve_days >= scenario.days,
        },
      ]
    : [];

  const coveredCount = resources.filter((r) => r.covered).length;

  const comfortLevel =
    coveredCount === 4
      ? {
          label: "High Comfort",
          color: "text-emerald-700 dark:text-emerald-300",
          bg: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800",
          icon: "🌿",
        }
      : coveredCount === 3
        ? {
            label: "Good Comfort",
            color: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-50/60 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900",
            icon: "🌱",
          }
        : coveredCount >= 2
          ? {
              label: "Moderate Comfort",
              color: "text-amber-700 dark:text-amber-300",
              bg: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
              icon: "☀️",
            }
          : {
              label: "Some Preparation Ahead",
              color: "text-amber-600 dark:text-amber-400",
              bg: "bg-amber-50/60 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900",
              icon: "🌤️",
            };

  const comfortMessage =
    coveredCount === 4
      ? "Your homestead is well-prepared for this scenario. You can stay comfortable without needing to go anywhere."
      : coveredCount === 3
        ? "Three out of four resources are covered — this is a peaceful position. Consider which area to build up next."
        : coveredCount === 2
          ? "Half your resources cover this scenario. There's good ground to build on — take it one step at a time."
          : "A quiet week like this might call for some mindful preparation. Small steps make a real difference over time.";

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Page header */}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-foreground">
          Quiet Week Mode
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Explore how your homestead handles different scenarios — calmly and
          practically.
        </p>
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label
            htmlFor="quiet-location-select"
            className="text-sm font-medium"
          >
            Location
          </label>
          <Select value={locationId} onValueChange={setLocationId}>
            <SelectTrigger
              id="quiet-location-select"
              data-ocid="quiet.location_select"
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

        <div className="space-y-1.5">
          <p className="text-sm font-medium">Scenario</p>
          <div className="flex gap-2 flex-wrap" data-ocid="quiet.scenario.tab">
            {SCENARIOS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setScenarioId(s.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border",
                  scenarioId === s.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-accent/30",
                )}
                data-ocid="quiet.scenario.tab"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {!loc ? (
        <div className="text-center py-16 text-muted-foreground">
          <span className="text-4xl mb-3 block">🌿</span>
          <p className="font-medium">Select a location to begin</p>
          <p className="text-sm mt-1">
            Add locations first if you haven&apos;t yet.
          </p>
        </div>
      ) : (
        <>
          {/* Scenario description */}
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-sm text-muted-foreground">
              {scenario.description}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Planning for <strong>{loc.name}</strong> over{" "}
              <strong>{scenario.days} days</strong>
            </p>
          </div>

          {/* Comfort level */}
          <div
            className={cn(
              "rounded-xl border p-5 flex items-start gap-4",
              comfortLevel.bg,
            )}
            data-ocid="quiet.result_panel"
          >
            <span className="text-3xl">{comfortLevel.icon}</span>
            <div>
              <h2
                className={cn(
                  "font-display font-semibold text-lg",
                  comfortLevel.color,
                )}
                data-ocid="quiet.comfort_level"
              >
                {comfortLevel.label}
              </h2>
              <p className="text-sm mt-1 text-foreground/80">
                {comfortMessage}
              </p>
            </div>
          </div>

          {/* Resource breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {resources.map((r) => (
              <ResourceCard key={r.label} resource={r} />
            ))}
          </div>

          {/* Gentle note */}
          <div className="bg-accent/20 rounded-xl p-4 text-sm text-muted-foreground border border-border">
            <p>
              <span className="font-medium text-foreground">
                A note on preparedness:{" "}
              </span>
              These estimates are based on averages. Your actual comfort will
              also depend on your household size, the season, and your daily
              rhythms. Use this as a gentle guide, not a strict measure.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

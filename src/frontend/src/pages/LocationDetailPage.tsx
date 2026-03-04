import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Crosshair,
  Lightbulb,
  MapPin,
  Save,
  TrendingUp,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  BuffersForm,
  ComfortForm,
  EnergyForm,
  FoodForm,
  HeatingFuelForm,
  LandWaterForm,
  WaterForm,
} from "../components/PillarForms";
import { RadarChart } from "../components/RadarChart";
import { ScoreBadge } from "../components/ScoreBadge";
import { ScoreRing } from "../components/ScoreRing";
import { DEFAULT_HEATING_FUEL } from "../hooks/useLocations";
import { useLocations } from "../hooks/useLocations";
import {
  computeAllScores,
  computeNextBestUpgrade,
  computeTopUpgrades,
  getScoreLabel,
} from "../scoring";
import type { LocationProfile } from "../types";

const PILLAR_ICONS: Record<string, string> = {
  energy: "⚡",
  water: "💧",
  food: "🌱",
  comfort: "🏠",
  buffers: "🔧",
  land_water: "🌿",
};

interface ExplainPanelProps {
  loc: LocationProfile;
  scores: ReturnType<typeof computeAllScores>;
}

function ExplainPanel({ loc, scores }: ExplainPanelProps) {
  const {
    energy: e,
    water: w,
    food: f,
    comfort: c,
    buffers: b,
    land_water: lw,
  } = loc;
  const coverage =
    (e.solar_kw * e.winter_sun_hours * 0.7 + (e.generator ? 3 : 0)) /
    Math.max(e.daily_kwh_use, 1);
  const batteryDays = e.battery_kwh / Math.max(e.daily_kwh_use, 1);
  const waterDays = w.storage_gallons / 15;

  const items = [
    {
      icon: "⚡",
      label: "Energy",
      score: scores.energy,
      detail: `Your solar produces ~${(e.solar_kw * e.winter_sun_hours * 0.7).toFixed(1)} kWh/day in winter. Coverage ratio: ${coverage.toFixed(1)}×. Battery gives ~${batteryDays.toFixed(1)} days of backup. ${e.generator ? "Generator adds resilience." : "No generator on site."}`,
    },
    {
      icon: "💧",
      label: "Water",
      score: scores.water,
      detail: `${w.storage_gallons} gallons stored = ~${waterDays.toFixed(0)} days at 15 gal/day. Source: ${w.primary_source}. ${w.gravity_option ? "Gravity feed works without power. " : "Pump-dependent delivery. "}Filtration level: ${w.filtration_level}.`,
    },
    {
      icon: "🌱",
      label: "Food",
      score: scores.food,
      detail: `${f.stored_food_months} months of stored food (${Math.round((f.stored_food_months / 12) * 100)}% of max). ${f.chickens_count} chickens${f.goats_count > 0 ? `, ${f.goats_count} goats` : ""}. Garden: ${f.garden_sqft} sq ft. ${f.root_cellar ? "Root cellar provides natural preservation." : "No root cellar."}`,
    },
    {
      icon: "🏠",
      label: "Comfort",
      score: scores.comfort,
      detail: `Heat: ${c.heat_type} system${c.backup_heat ? " with backup" : ", no backup"}. Cooking: ${c.cooking_type}${c.backup_cooking ? " with backup" : ", no backup"}. ${c.backup_heat && c.backup_cooking ? "Both backups in place — great resilience." : "Adding backups would improve your score."}`,
    },
    {
      icon: "🔧",
      label: "Buffers",
      score: scores.buffers,
      detail: `${b.fuel_reserve_days} days of fuel. ${b.feed_reserve_days} days of animal feed. Spare parts: ${b.spare_parts_kit}. Tools: ${b.tools_completeness}% complete. Resupply: ${b.resupply_trips_per_month} trip${b.resupply_trips_per_month !== 1 ? "s" : ""}/month.`,
    },
    {
      icon: "🌿",
      label: "Land & Water Ecology",
      score: scores.land_water,
      detail: `${lw.has_surface_water ? `Surface water: ${lw.water_type} (${lw.water_reliability.replace("_", "-")}). ` : "No surface water on property. "}Irrigation access: ${lw.access_for_irrigation}. ${lw.has_well ? `Well: ${lw.well_gpm} GPM, ${lw.well_reliability} reliability. ` : "No well drilled. "}Woods: ${lw.woods_percent}%. Deer sign: ${lw.deer_sign}.`,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-3">
        Overall: <strong>{Math.round(scores.overall)}/100</strong> — "
        {getScoreLabel(scores.overall)}". Weights: Energy 18%, Water 18%, Food
        22%, Comfort 17%, Buffers 13%, Land &amp; Water 12%.
      </div>
      {items.map((item) => (
        <div
          key={item.label}
          className="flex gap-3 p-3 rounded-lg bg-accent/20 border border-border"
        >
          <span className="text-lg shrink-0 mt-0.5">{item.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="font-medium text-sm">{item.label}</span>
              <ScoreBadge score={item.score} size="sm" />
            </div>
            <p className="text-xs text-muted-foreground">{item.detail}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function PillarCard({
  icon,
  title,
  score,
  children,
  dataOcid,
}: {
  icon: string;
  title: string;
  score: number;
  children: React.ReactNode;
  dataOcid: string;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div
      className="bg-card border border-border rounded-xl overflow-hidden shadow-xs"
      data-ocid={dataOcid}
    >
      <button
        type="button"
        className="w-full flex items-center gap-3 p-4 hover:bg-accent/20 transition-colors"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="text-xl">{icon}</span>
        <span className="font-display font-semibold text-base">{title}</span>
        <div className="ml-auto flex items-center gap-2">
          <ScoreBadge score={score} size="sm" />
          {open ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>
      {open && (
        <div className="p-4 pt-0 border-t border-border">{children}</div>
      )}
    </div>
  );
}

export function LocationDetailPage() {
  const { id } = useParams({ from: "/location/$id" });
  const navigate = useNavigate();
  const { getLocation, updateLocation } = useLocations();

  const source = getLocation(id);
  const [draft, setDraft] = useState<LocationProfile | null>(source ?? null);

  const scores = draft ? computeAllScores(draft) : null;
  const upgrade = draft ? computeNextBestUpgrade(draft) : null;

  const [targetScore, setTargetScore] = useState<number>(() => {
    if (!source) return 75;
    const overall = computeAllScores(source).overall;
    return Math.min(100, Math.round(overall) + 20);
  });

  const handleSave = useCallback(() => {
    if (!draft) return;
    updateLocation(draft.id, {
      name: draft.name,
      state: draft.state,
      notes: draft.notes,
      energy: draft.energy,
      water: draft.water,
      food: draft.food,
      comfort: draft.comfort,
      buffers: draft.buffers,
      land_water: draft.land_water,
      heating_fuel: draft.heating_fuel,
    });
    toast.success("Changes saved");
  }, [draft, updateLocation]);

  const update = <K extends keyof LocationProfile>(
    key: K,
    val: LocationProfile[K],
  ) => {
    setDraft((prev) => (prev ? { ...prev, [key]: val } : prev));
  };

  if (!draft || !source || !scores) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Location not found.</p>
        <Button
          className="mt-4"
          variant="outline"
          onClick={() => navigate({ to: "/" })}
          data-ocid="detail.back_link"
        >
          Back to Locations
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top nav */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ to: "/" })}
          className="gap-1.5 -ml-2"
          data-ocid="detail.back_link"
        >
          <ArrowLeft className="h-4 w-4" />
          All Locations
        </Button>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-6">
        {/* Score ring */}
        <div className="flex flex-col items-center gap-2 shrink-0">
          <ScoreRing score={scores.overall} size={120} strokeWidth={8} />
          <p className="text-sm font-medium text-center text-muted-foreground">
            Peaceful Score
          </p>
          <span
            className={cn(
              "text-xs font-semibold px-3 py-1 rounded-full",
              scores.overall >= 65
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                : scores.overall >= 40
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                  : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
            )}
          >
            {getScoreLabel(scores.overall)}
          </span>
        </div>

        {/* Location name/info form */}
        <div className="flex-1 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="loc-name">Location Name</Label>
              <Input
                id="loc-name"
                value={draft.name}
                onChange={(e) => update("name", e.target.value)}
                className="font-medium"
                data-ocid="detail.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="loc-state">State</Label>
              <div className="relative">
                <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  id="loc-state"
                  value={draft.state}
                  onChange={(e) => update("state", e.target.value)}
                  className="pl-8"
                  data-ocid="detail.input"
                />
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="loc-notes">Notes</Label>
            <Textarea
              id="loc-notes"
              value={draft.notes}
              onChange={(e) => update("notes", e.target.value)}
              rows={2}
              placeholder="Property description, considerations…"
              data-ocid="detail.textarea"
            />
          </div>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center">
        <h2 className="font-display font-semibold text-base mb-4 self-start">
          Pillar Balance
        </h2>
        <RadarChart
          scores={{
            energy: scores.energy,
            water: scores.water,
            food: scores.food,
            comfort: scores.comfort,
            buffers: scores.buffers,
            land_water: scores.land_water,
          }}
          size={300}
        />
      </div>

      {/* Next Best Upgrade */}
      {upgrade && (
        <div
          className="bg-card border border-border rounded-xl p-5 flex items-start gap-4"
          data-ocid="detail.upgrade_card"
        >
          <div className="shrink-0 p-2.5 rounded-full bg-primary/10">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-base mb-0.5">
              Next Best Upgrade
            </h3>
            <p className="text-sm text-muted-foreground">
              <span className="text-foreground font-medium">
                {upgrade.label}
              </span>{" "}
              would gain you{" "}
              <span className="text-primary font-semibold">
                +{upgrade.gain.toFixed(1)} points
              </span>
            </p>
          </div>
          <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5 ml-auto" />
        </div>
      )}

      {/* Target Score */}
      {(() => {
        const currentScore = Math.round(scores.overall);
        const isGoalMet = currentScore >= targetScore;
        const topUpgrades = !isGoalMet ? computeTopUpgrades(draft, 3) : [];
        return (
          <div
            className="bg-card border border-border rounded-xl p-5 space-y-4"
            data-ocid="detail.target_score_card"
          >
            <div className="flex items-center gap-3">
              <div className="shrink-0 p-2.5 rounded-full bg-primary/10">
                <Crosshair className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-base leading-tight">
                  Target Score
                </h3>
                <p className="text-sm text-muted-foreground">
                  Your score:{" "}
                  <span className="font-semibold text-foreground">
                    {currentScore}
                  </span>{" "}
                  → Target:{" "}
                  <span className="font-semibold text-primary">
                    {targetScore}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Slider
                min={1}
                max={100}
                step={1}
                value={[targetScore]}
                onValueChange={([v]) => setTargetScore(v)}
                className="flex-1"
                data-ocid="detail.target_score_slider"
              />
              <span className="text-2xl font-bold text-primary w-10 text-right tabular-nums">
                {targetScore}
              </span>
            </div>

            {isGoalMet ? (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-sm font-medium">
                <span>🎯</span>
                <span>You've reached your target! Set a higher goal.</span>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  Top actions to reach {targetScore} points
                </p>
                {topUpgrades.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">
                    No upgrades available — you're at maximum potential with
                    these parameters.
                  </p>
                ) : (
                  <ol className="space-y-2">
                    {topUpgrades.map((upg, idx) => (
                      <li
                        key={upg.label}
                        className="flex items-center gap-3 p-3 rounded-lg bg-accent/20 border border-border"
                      >
                        <span className="shrink-0 w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="flex-1 text-sm font-medium">
                          {upg.label}
                        </span>
                        <Badge
                          variant="secondary"
                          className="shrink-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 font-semibold text-xs"
                        >
                          +{upg.gain.toFixed(1)} pts
                        </Badge>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* Pillar Cards */}
      <div className="space-y-4">
        <PillarCard
          icon={PILLAR_ICONS.energy}
          title="Energy Comfort"
          score={scores.energy}
          dataOcid="detail.energy_card"
        >
          <div className="pt-3">
            <EnergyForm
              value={draft.energy}
              onChange={(v) => update("energy", v)}
            />
          </div>
        </PillarCard>

        <PillarCard
          icon={PILLAR_ICONS.water}
          title="Water Security"
          score={scores.water}
          dataOcid="detail.water_card"
        >
          <div className="pt-3">
            <WaterForm
              value={draft.water}
              onChange={(v) => update("water", v)}
            />
          </div>
        </PillarCard>

        <PillarCard
          icon={PILLAR_ICONS.food}
          title="Food Continuity"
          score={scores.food}
          dataOcid="detail.food_card"
        >
          <div className="pt-3">
            <FoodForm value={draft.food} onChange={(v) => update("food", v)} />
          </div>
        </PillarCard>

        <PillarCard
          icon={PILLAR_ICONS.comfort}
          title="Home Comfort Independence"
          score={scores.comfort}
          dataOcid="detail.comfort_card"
        >
          <div className="pt-3">
            <ComfortForm
              value={draft.comfort}
              onChange={(v) => update("comfort", v)}
            />
          </div>
        </PillarCard>

        <PillarCard
          icon={PILLAR_ICONS.buffers}
          title="Buffers &amp; Rhythm"
          score={scores.buffers}
          dataOcid="detail.buffers_card"
        >
          <div className="pt-3">
            <BuffersForm
              value={draft.buffers}
              onChange={(v) => update("buffers", v)}
            />
          </div>
        </PillarCard>

        <PillarCard
          icon={PILLAR_ICONS.land_water}
          title="Land & Water Ecology"
          score={scores.land_water}
          dataOcid="detail.land_water_card"
        >
          <div className="pt-3">
            <LandWaterForm
              value={draft.land_water}
              onChange={(v) => update("land_water", v)}
            />
          </div>
        </PillarCard>

        {/* Heating Fuel & House Context — not scored but used in Winter Mode */}
        <div
          className="bg-card border border-border rounded-xl overflow-hidden shadow-xs"
          data-ocid="detail.heating_fuel_card"
        >
          <div className="w-full flex items-center gap-3 p-4 bg-accent/10 border-b border-border">
            <span className="text-xl">🔥</span>
            <div>
              <span className="font-display font-semibold text-base">
                Heating Fuel &amp; House Context
              </span>
              <p className="text-xs text-muted-foreground mt-0.5">
                Used in Winter Mode to estimate firewood and propane coverage.
              </p>
            </div>
          </div>
          <div className="p-4 pt-3">
            <HeatingFuelForm
              value={draft.heating_fuel ?? DEFAULT_HEATING_FUEL}
              onChange={(v) => update("heating_fuel", v)}
            />
          </div>
        </div>
      </div>

      {/* Explain My Score */}
      <Accordion type="single" collapsible>
        <AccordionItem
          value="explain"
          className="bg-card border border-border rounded-xl overflow-hidden"
          data-ocid="detail.explain_panel"
        >
          <AccordionTrigger className="px-5 py-4 font-display font-semibold text-base hover:no-underline">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              Explain My Score
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5">
            <ExplainPanel loc={draft} scores={scores} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Save button */}
      <div className="flex justify-end pb-4">
        <Button
          size="lg"
          onClick={handleSave}
          className="gap-2"
          data-ocid="detail.save_button"
        >
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}

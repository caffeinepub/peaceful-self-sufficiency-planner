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
  X,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  BuffersForm,
  ComfortForm,
  EnergyForm,
  FoodForm,
  HeatingFuelForm,
  LandProductivityForm,
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
import { STARTER_PROFILES } from "../starterProfiles";
import type { LandProductivityData, LocationProfile } from "../types";

const PILLAR_ICONS: Record<string, string> = {
  energy: "⚡",
  water: "💧",
  food: "🌱",
  comfort: "🏠",
  buffers: "🔧",
  land_water: "🌿",
};

// ─── Heating coverage helper ────────────────────────────────────────────────
function computeHeatDays(loc: LocationProfile): number {
  const hf = loc.heating_fuel ?? DEFAULT_HEATING_FUEL;
  const priorityFactor =
    hf.heating_priority === "whole_house"
      ? 1.0
      : hf.heating_priority === "living_area"
        ? 0.6
        : 0.35;
  const insulationFactor =
    hf.insulation_level === "poor"
      ? 1.35
      : hf.insulation_level === "good"
        ? 0.8
        : hf.insulation_level === "excellent"
          ? 0.65
          : 1.0;
  const tempFactor =
    (hf.winterTempBand ?? "cool") === "mild"
      ? 0.8
      : (hf.winterTempBand ?? "cool") === "cold"
        ? 1.2
        : (hf.winterTempBand ?? "cool") === "very_cold"
          ? 1.4
          : 1.0;
  const demandFactor = priorityFactor * insulationFactor * tempFactor;
  const roleMultiplier =
    hf.firewood_role === "secondary"
      ? 0.5
      : hf.firewood_role === "occasional"
        ? 0.2
        : 1.0;
  const woodDays =
    ((hf.firewood_cords * 7) / Math.max(demandFactor, 0.01)) * roleMultiplier;

  const tankGallons =
    hf.propane_tank_preset === "custom"
      ? hf.propane_custom_gallons
      : (hf.propane_tank_preset as number);
  const usableGallons = (tankGallons * hf.propane_fill_percent) / 100;
  const otherPerDay =
    (hf.propane_uses_cooking ? 0.2 : 0) +
    (hf.propane_uses_water_heater ? 0.5 : 0) +
    (hf.propane_uses_generator ? 0.8 : 0);
  const heatGallonsPerDay = 2.0 * demandFactor;
  const usableForHeat = Math.max(usableGallons - otherPerDay * 30, 0);
  const propaneDays = hf.propane_uses_heating
    ? usableForHeat / Math.max(heatGallonsPerDay, 0.01)
    : 0;

  if (hf.firewood_role === "occasional") {
    return propaneDays + woodDays * 0.3;
  }
  return woodDays + propaneDays;
}

// ─── Property Insights ──────────────────────────────────────────────────────
type InsightCategory = "strength" | "watch" | "opportunity";
interface Insight {
  category: InsightCategory;
  icon: string;
  text: string;
}

function computeInsights(loc: LocationProfile): Insight[] {
  const { energy: e, water: w, food: f, buffers: b, land_water: lw } = loc;
  const hf = loc.heating_fuel ?? DEFAULT_HEATING_FUEL;
  const heatDays = computeHeatDays(loc);
  const lp = loc.land_productivity;
  const woodedAcres = lp?.wooded_acres ?? 0;

  const strengths: Insight[] = [];
  const watches: Insight[] = [];
  const opportunities: Insight[] = [];

  // ── Energy ──
  const hasSolar = e.solar_kw > 0;
  const hasBattery = e.battery_kwh > 0;
  if (hasSolar && hasBattery && e.generator) {
    strengths.push({
      category: "strength",
      icon: "⚡",
      text: "Energy independence is strong — solar, battery, and generator all in place.",
    });
  } else if (hasSolar && hasBattery) {
    strengths.push({
      category: "strength",
      icon: "⚡",
      text: "Solar with battery storage provides reliable backup power.",
    });
  } else if (!hasSolar && !e.generator) {
    watches.push({
      category: "watch",
      icon: "⚡",
      text: "No off-grid power source on site — grid dependency is high.",
    });
  }
  if (hasSolar && !hasBattery) {
    opportunities.push({
      category: "opportunity",
      icon: "⚡",
      text: "Adding battery storage would retain solar energy through nights and cloudy days.",
    });
  }

  // ── Water ──
  if (w.primary_source === "spring" || w.gravity_option) {
    strengths.push({
      category: "strength",
      icon: "💧",
      text: "Reliable natural water source improves resilience without depending on power.",
    });
  } else if (w.storage_gallons >= 500) {
    strengths.push({
      category: "strength",
      icon: "💧",
      text: `${w.storage_gallons} gallons of stored water provides a solid short-term reserve.`,
    });
  } else if (w.storage_gallons < 100) {
    watches.push({
      category: "watch",
      icon: "💧",
      text: "Water storage is limited — a short disruption could quickly expose this gap.",
    });
  }
  if (!w.gravity_option && w.primary_source !== "spring") {
    opportunities.push({
      category: "opportunity",
      icon: "💧",
      text: "A gravity-fed option would keep water flowing even without electricity.",
    });
  }

  // ── Food ──
  if (f.stored_food_months >= 3) {
    strengths.push({
      category: "strength",
      icon: "🌱",
      text: `${f.stored_food_months} months of stored food is a meaningful cushion for extended disruptions.`,
    });
  } else if (f.stored_food_months < 1) {
    watches.push({
      category: "watch",
      icon: "🌱",
      text: "Food reserves are minimal — less than one month of stored food on hand.",
    });
  }
  if (f.garden_sqft < 400) {
    opportunities.push({
      category: "opportunity",
      icon: "🌱",
      text: "Vegetable production potential is limited — a larger garden would meaningfully boost food security.",
    });
  }

  // ── Heating ──
  if (heatDays >= 30) {
    strengths.push({
      category: "strength",
      icon: "🔥",
      text: `Heating reserves are strong — estimated ${Math.round(heatDays)} days of coverage.`,
    });
  } else if (
    heatDays < 20 &&
    (hf.firewood_cords > 0 || hf.propane_uses_heating)
  ) {
    watches.push({
      category: "watch",
      icon: "🔥",
      text: `Winter heating reserves are modest — estimated ${Math.round(heatDays)} days of coverage.`,
    });
  }
  if (heatDays >= 10 && heatDays < 30) {
    opportunities.push({
      category: "opportunity",
      icon: "🔥",
      text: "Increasing firewood or propane reserves would extend winter heating coverage.",
    });
  }

  // ── Land / Woodland ──
  if (lw.woods_percent > 30 || woodedAcres >= 5) {
    strengths.push({
      category: "strength",
      icon: "🌿",
      text: "Strong woodland resources support long-term firewood production and wildlife habitat.",
    });
  } else if (lw.woods_percent < 10 && woodedAcres < 2) {
    opportunities.push({
      category: "opportunity",
      icon: "🌿",
      text: "Limited woodland — planting trees would build long-term firewood and habitat value.",
    });
  }

  // ── Wildlife ──
  const hasWildlife =
    lw.deer_sign === "occasional" ||
    lw.deer_sign === "frequent" ||
    lw.fish_present === "some" ||
    lw.fish_present === "good" ||
    (lw.other_game &&
      lw.other_game.length > 0 &&
      !lw.other_game.every((g) => g === "none" || g === "unknown"));
  if (hasWildlife && lw.has_surface_water) {
    strengths.push({
      category: "strength",
      icon: "🦌",
      text: "Wildlife presence combined with surface water indicates a productive natural ecosystem.",
    });
  }

  // ── Buffers ──
  if (b.fuel_reserve_days >= 30) {
    strengths.push({
      category: "strength",
      icon: "🔧",
      text: "Good fuel reserves support extended outages without resupply.",
    });
  } else if (b.fuel_reserve_days < 7) {
    watches.push({
      category: "watch",
      icon: "🔧",
      text: "Fuel reserves are limited — consider building up to at least a 2-week buffer.",
    });
  }

  // Cap to ~2 per category, total max 6
  const picked: Insight[] = [
    ...strengths.slice(0, 2),
    ...watches.slice(0, 2),
    ...opportunities.slice(0, 2),
  ].slice(0, 6);

  return picked;
}

function PropertyInsightsCard({ loc }: { loc: LocationProfile }) {
  const insights = computeInsights(loc);
  const grouped = {
    strength: insights.filter((i) => i.category === "strength"),
    watch: insights.filter((i) => i.category === "watch"),
    opportunity: insights.filter((i) => i.category === "opportunity"),
  };

  if (insights.length === 0) return null;

  const sections: {
    key: InsightCategory;
    label: string;
    color: string;
    dot: string;
  }[] = [
    {
      key: "strength",
      label: "Strengths",
      color: "text-emerald-700 dark:text-emerald-400",
      dot: "bg-emerald-500",
    },
    {
      key: "watch",
      label: "Watch Areas",
      color: "text-amber-700 dark:text-amber-400",
      dot: "bg-amber-500",
    },
    {
      key: "opportunity",
      label: "Opportunities",
      color: "text-sky-700 dark:text-sky-400",
      dot: "bg-sky-500",
    },
  ];

  return (
    <div
      className="bg-card border border-border rounded-xl overflow-hidden shadow-xs"
      data-ocid="detail.property_insights_card"
    >
      <div className="flex items-center gap-3 p-4 bg-accent/10 border-b border-border">
        <span className="text-xl">🔍</span>
        <div>
          <span className="font-display font-semibold text-base">
            Property Insights
          </span>
          <p className="text-xs text-muted-foreground mt-0.5">
            Observations based on your current inputs — does not affect your
            Peaceful Score
          </p>
        </div>
      </div>
      <div className="p-4 space-y-4">
        {sections.map(({ key, label, color, dot }) => {
          const items = grouped[key];
          if (items.length === 0) return null;
          return (
            <div key={key}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-2 h-2 rounded-full ${dot} shrink-0`} />
                <span
                  className={`text-xs font-semibold uppercase tracking-wide ${color}`}
                >
                  {label}
                </span>
              </div>
              <ul className="space-y-1.5">
                {items.map((insight) => (
                  <li
                    key={insight.text}
                    className="flex items-start gap-2.5 text-sm text-foreground/90"
                  >
                    <span className="shrink-0 mt-px text-base leading-none">
                      {insight.icon}
                    </span>
                    <span>{insight.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── ExplainPanel ────────────────────────────────────────────────────────────
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
      detail: `${b.fuel_reserve_days} days of fuel. ${b.feed_reserve_days} days of animal feed. Spare parts: ${b.spare_parts_kit}. Resupply: ${b.resupply_trips_per_month} trip${b.resupply_trips_per_month !== 1 ? "s" : ""}/month.`,
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

function SectionGroupDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-2">
      <div className="h-px flex-1 bg-border" />
      <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <div className="h-px flex-1 bg-border" />
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

  // Re-apply starter profile state
  const [reapplyOpen, setReapplyOpen] = useState(false);
  const [reapplySelectedId, setReapplySelectedId] = useState("");

  const handleApplyProfile = useCallback(
    (profileId: string) => {
      const profile = STARTER_PROFILES.find((p) => p.id === profileId);
      if (!profile || !draft) return;
      setDraft((prev) =>
        prev
          ? {
              ...prev,
              energy: profile.energy,
              water: profile.water,
              food: profile.food,
              comfort: profile.comfort,
              buffers: profile.buffers,
              heating_fuel: {
                ...(prev.heating_fuel ?? DEFAULT_HEATING_FUEL),
                ...profile.heating_fuel,
              },
            }
          : prev,
      );
      toast.success(`Starter profile applied: ${profile.name}`);
      setReapplyOpen(false);
      setReapplySelectedId("");
    },
    [draft],
  );

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

      {/* Re-apply starter profile */}
      <div data-ocid="location_detail.reapply_profile.section">
        {!reapplyOpen ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setReapplyOpen(true)}
              className="text-xs text-muted-foreground hover:text-primary underline underline-offset-2 transition-colors"
              data-ocid="location_detail.reapply_profile.button"
            >
              Re-apply a starter profile
            </button>
          </div>
        ) : (
          <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">Re-apply a starter profile</p>
              <button
                type="button"
                onClick={() => {
                  setReapplyOpen(false);
                  setReapplySelectedId("");
                }}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close"
                data-ocid="location_detail.reapply_profile.close_button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              This will overwrite your current settings with the selected
              profile's defaults.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {STARTER_PROFILES.map((profile, idx) => (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => setReapplySelectedId(profile.id)}
                  data-ocid={`location_detail.reapply_profile.item.${idx + 1}`}
                  className={cn(
                    "text-left p-2.5 rounded-lg border-2 transition-all hover:border-primary/50 hover:bg-primary/5",
                    reapplySelectedId === profile.id
                      ? "border-primary bg-primary/8 ring-1 ring-primary/20"
                      : "border-border bg-card",
                  )}
                >
                  <p className="font-medium text-xs leading-tight">
                    {profile.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug line-clamp-2">
                    {profile.description}
                  </p>
                </button>
              ))}
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setReapplyOpen(false);
                  setReapplySelectedId("");
                }}
                data-ocid="location_detail.reapply_profile.cancel_button"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!reapplySelectedId}
                onClick={() =>
                  reapplySelectedId && handleApplyProfile(reapplySelectedId)
                }
                data-ocid="location_detail.reapply_profile.confirm_button"
              >
                Apply Profile
              </Button>
            </div>
          </div>
        )}
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

      {/* Property Insights — advisory, near top, after radar */}
      <PropertyInsightsCard loc={draft} />

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

      {/* Pillar Cards — grouped by logical flow */}
      <div className="space-y-4">
        <SectionGroupDivider label="Core Systems" />

        <PillarCard
          icon={PILLAR_ICONS.energy}
          title="Energy System"
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

        <SectionGroupDivider label="Food Systems" />

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

        <SectionGroupDivider label="Home Independence" />

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

        <SectionGroupDivider label="Resilience Buffers" />

        <PillarCard
          icon={PILLAR_ICONS.buffers}
          title="Buffers & Rhythm"
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

        <SectionGroupDivider label="Land Resources" />

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

        {/* Land Productivity — advisory only, does not affect score */}
        <div
          className="bg-card border border-border rounded-xl overflow-hidden shadow-xs"
          data-ocid="detail.land_productivity_card"
        >
          <div className="w-full flex items-center gap-3 p-4 bg-accent/10 border-b border-border">
            <span className="text-xl">🌾</span>
            <div>
              <span className="font-display font-semibold text-base">
                Land Productivity
              </span>
              <p className="text-xs text-muted-foreground mt-0.5">
                Advisory only — does not affect your Peaceful Score
              </p>
            </div>
          </div>
          <div className="p-4 pt-3">
            <LandProductivityForm
              gardenSqft={draft.food.garden_sqft}
              landWater={draft.land_water}
              value={
                draft.land_productivity ?? {
                  fruit_trees: "none",
                  wooded_acres: 0,
                  pasture_acres: 0,
                }
              }
              onChange={(v: LandProductivityData) =>
                update("land_productivity", v)
              }
            />
          </div>
        </div>

        <SectionGroupDivider label="Winter Planning" />

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

      {/* Explain My Score — moved to bottom */}
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

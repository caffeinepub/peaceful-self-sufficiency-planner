import type {
  BuffersPillar,
  ComfortPillar,
  EnergyPillar,
  FoodPillar,
  LocationProfile,
  WaterPillar,
} from "./types";

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function computeEnergyScore(e: EnergyPillar): number {
  const coverage_ratio =
    (e.solar_kw * e.winter_sun_hours * 0.7 + (e.generator ? 3 : 0)) /
    Math.max(e.daily_kwh_use, 1);
  const battery_days = e.battery_kwh / Math.max(e.daily_kwh_use, 1);
  return clamp(
    coverage_ratio * 60 +
      (Math.min(battery_days, 3) / 3) * 30 +
      (e.generator ? 10 : 0),
    0,
    100,
  );
}

export function computeWaterScore(w: WaterPillar): number {
  const stored_days = w.storage_gallons / 15;
  const filtration_bonus: Record<string, number> = {
    basic: 0,
    good: 7,
    excellent: 12,
  };
  const source_bonus: Record<string, number> = {
    well: 10,
    spring: 12,
    city: 0,
    rain: 6,
  };
  return clamp(
    (Math.min(stored_days, 14) / 14) * 60 +
      (w.gravity_option ? 15 : 0) +
      filtration_bonus[w.filtration_level] +
      source_bonus[w.primary_source],
    0,
    100,
  );
}

export function computeFoodScore(f: FoodPillar): number {
  const stored_bonus = (Math.min(f.stored_food_months, 12) / 12) * 55;
  const protein_bonus =
    (Math.min(f.chickens_count, 12) / 12) * 15 +
    (Math.min(f.goats_count, 4) / 4) * 15;
  const cellar_bonus = f.root_cellar ? 10 : 0;
  const garden_bonus = (Math.min(f.garden_sqft, 2000) / 2000) * 15;
  return clamp(
    stored_bonus + protein_bonus + cellar_bonus + garden_bonus,
    0,
    100,
  );
}

export function computeComfortScore(c: ComfortPillar): number {
  const heat_score: Record<string, number> = {
    electric: 20,
    propane: 55,
    wood: 70,
    mixed: 80,
  };
  const cooking_score: Record<string, number> = {
    electric: 25,
    gas: 55,
    wood: 65,
    mixed: 75,
  };
  const backups = (c.backup_heat ? 10 : 0) + (c.backup_cooking ? 10 : 0);
  return clamp(
    heat_score[c.heat_type] * 0.5 +
      cooking_score[c.cooking_type] * 0.5 +
      backups,
    0,
    100,
  );
}

export function computeBuffersScore(b: BuffersPillar): number {
  const fuel_score = (Math.min(b.fuel_reserve_days, 30) / 30) * 30;
  const feed_score = (Math.min(b.feed_reserve_days, 30) / 30) * 20;
  const spare_parts: Record<string, number> = { none: 0, basic: 10, solid: 18 };
  const tools_score = (b.tools_completeness / 100) * 22;
  const trips_penalty = (Math.min(b.resupply_trips_per_month, 12) / 12) * 20;
  return clamp(
    fuel_score +
      feed_score +
      spare_parts[b.spare_parts_kit] +
      tools_score +
      (20 - trips_penalty),
    0,
    100,
  );
}

export function computeOverallScore(loc: LocationProfile): number {
  return (
    computeEnergyScore(loc.energy) * 0.2 +
    computeWaterScore(loc.water) * 0.2 +
    computeFoodScore(loc.food) * 0.25 +
    computeComfortScore(loc.comfort) * 0.2 +
    computeBuffersScore(loc.buffers) * 0.15
  );
}

export interface PillarScores {
  energy: number;
  water: number;
  food: number;
  comfort: number;
  buffers: number;
  overall: number;
}

export function computeAllScores(loc: LocationProfile): PillarScores {
  const energy = computeEnergyScore(loc.energy);
  const water = computeWaterScore(loc.water);
  const food = computeFoodScore(loc.food);
  const comfort = computeComfortScore(loc.comfort);
  const buffers = computeBuffersScore(loc.buffers);
  const overall =
    energy * 0.2 + water * 0.2 + food * 0.25 + comfort * 0.2 + buffers * 0.15;
  return { energy, water, food, comfort, buffers, overall };
}

export function getScoreColor(score: number): string {
  if (score >= 65) return "score-high";
  if (score >= 40) return "score-mid";
  return "score-low";
}

export function getScoreLabel(score: number): string {
  if (score >= 75) return "Thriving";
  if (score >= 60) return "Resilient";
  if (score >= 40) return "Developing";
  if (score >= 25) return "Starting Out";
  return "Early Days";
}

export interface UpgradeSuggestion {
  label: string;
  gain: number;
}

export function computeNextBestUpgrade(
  loc: LocationProfile,
): UpgradeSuggestion | null {
  const baseScore = computeOverallScore(loc);

  const upgrades: {
    label: string;
    apply: (l: LocationProfile) => LocationProfile;
  }[] = [
    {
      label: "+3 months stored food",
      apply: (l) => ({
        ...l,
        food: {
          ...l.food,
          stored_food_months: Math.min(12, l.food.stored_food_months + 3),
        },
      }),
    },
    {
      label: "+5 kWh battery storage",
      apply: (l) => ({
        ...l,
        energy: { ...l.energy, battery_kwh: l.energy.battery_kwh + 5 },
      }),
    },
    {
      label: "Add gravity water feed",
      apply: (l) => ({ ...l, water: { ...l.water, gravity_option: true } }),
    },
    {
      label: "Add root cellar",
      apply: (l) => ({ ...l, food: { ...l.food, root_cellar: true } }),
    },
    {
      label: "Reduce resupply trips by 2",
      apply: (l) => ({
        ...l,
        buffers: {
          ...l.buffers,
          resupply_trips_per_month: Math.max(
            0,
            l.buffers.resupply_trips_per_month - 2,
          ),
        },
      }),
    },
    {
      label: "Add backup heat source",
      apply: (l) => ({ ...l, comfort: { ...l.comfort, backup_heat: true } }),
    },
    {
      label: "Add backup cooking method",
      apply: (l) => ({ ...l, comfort: { ...l.comfort, backup_cooking: true } }),
    },
    {
      label: "+1 kW solar capacity",
      apply: (l) => ({
        ...l,
        energy: { ...l.energy, solar_kw: l.energy.solar_kw + 1 },
      }),
    },
  ];

  let best: UpgradeSuggestion | null = null;

  for (const upgrade of upgrades) {
    const modified = upgrade.apply(loc);
    const newScore = computeOverallScore(modified);
    const gain = newScore - baseScore;
    if (gain > 0.1 && (!best || gain > best.gain)) {
      best = { label: upgrade.label, gain };
    }
  }

  return best;
}

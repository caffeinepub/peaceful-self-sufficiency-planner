import type {
  BuffersPillar,
  ComfortPillar,
  EnergyPillar,
  FoodPillar,
  LandWaterPillar,
  LocationProfile,
  WaterPillar,
} from "./types";

export interface WinterResource {
  label: string;
  icon: string;
  days: number;
  scenarioDays: number;
  covered: boolean;
  note?: string;
}

export interface WinterResult {
  winterScore: number;
  winterLabel: string;
  calmDays: number;
  resources: WinterResource[];
}

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
  const stored_bonus = (Math.min(f.stored_food_months, 12) / 12) * 60;
  const protein_bonus =
    (Math.min(f.chickens_count, 12) / 12) * 15 +
    (Math.min(f.goats_count, 4) / 4) * 15;
  const cellar_bonus = f.root_cellar ? 10 : 0;
  const garden_bonus = (Math.min(f.garden_sqft, 2000) / 2000) * 10;
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
  const fuel_score = (Math.min(b.fuel_reserve_days, 30) / 30) * 40;
  const feed_score = (Math.min(b.feed_reserve_days, 30) / 30) * 25;
  const spare_parts: Record<string, number> = { none: 0, basic: 15, solid: 25 };
  const trips_penalty = (Math.min(b.resupply_trips_per_month, 12) / 12) * 20;
  return clamp(
    fuel_score +
      feed_score +
      spare_parts[b.spare_parts_kit] +
      (20 - trips_penalty),
    0,
    100,
  );
}

export function computeLandWaterScore(lw: LandWaterPillar): number {
  // Surface water base (0–40)
  let waterBase = 0;
  if (lw.has_surface_water && lw.water_type !== "none") {
    const typeScore: Record<string, number> = {
      stream: 15,
      creek: 15,
      river: 20,
      lake: 20,
      pond: 18,
      multiple: 22,
      none: 0,
    };
    const reliabilityMult: Record<string, number> = {
      seasonal: 0.6,
      intermittent: 0.75,
      year_round: 1.0,
    };
    waterBase = Math.min(
      40,
      (typeScore[lw.water_type] ?? 0) *
        (reliabilityMult[lw.water_reliability] ?? 1),
    );
  }

  // Irrigation access (0–20)
  const irrigationScore: Record<string, number> = {
    none: 0,
    limited: 7,
    good: 14,
    excellent: 20,
  };
  const irrigation = irrigationScore[lw.access_for_irrigation] ?? 0;

  // Fish (0–10)
  const fishScore: Record<string, number> = {
    unknown: 4,
    none: 0,
    some: 5,
    good: 10,
  };
  const fish = fishScore[lw.fish_present] ?? 0;

  // Waterfowl (0–10)
  const waterfowlScore: Record<string, number> = {
    unknown: 4,
    none: 0,
    seasonal: 6,
    frequent: 10,
  };
  const waterfowl = waterfowlScore[lw.ducks_geese_present] ?? 0;

  // Woods + habitat (0–15)
  const woodsScore = (lw.woods_percent / 100) * 10;
  const deerBonus: Record<string, number> = {
    unknown: 2,
    none: 0,
    occasional: 3,
    frequent: 5,
  };
  const habitat = woodsScore + (deerBonus[lw.deer_sign] ?? 0);

  // Well performance (0–15)
  let wellScore = 0;
  if (lw.has_well) {
    const gpm = lw.well_gpm;
    const gpmScore =
      gpm <= 1 ? 3 : gpm <= 3 ? 7 : gpm <= 5 ? 10 : gpm <= 10 ? 12 : 15;
    const relBonus: Record<string, number> = {
      unknown: 0,
      low: 0,
      medium: 2,
      high: 3,
    };
    wellScore = Math.min(15, gpmScore + (relBonus[lw.well_reliability] ?? 0));
  }

  return clamp(
    waterBase + irrigation + fish + waterfowl + habitat + wellScore,
    0,
    100,
  );
}

export function computeOverallScore(loc: LocationProfile): number {
  return (
    computeEnergyScore(loc.energy) * 0.16 +
    computeWaterScore(loc.water) * 0.16 +
    computeFoodScore(loc.food) * 0.3 +
    computeComfortScore(loc.comfort) * 0.16 +
    computeBuffersScore(loc.buffers) * 0.12 +
    computeLandWaterScore(loc.land_water) * 0.1
  );
}

export interface PillarScores {
  energy: number;
  water: number;
  food: number;
  comfort: number;
  buffers: number;
  land_water: number;
  overall: number;
}

export function computeAllScores(loc: LocationProfile): PillarScores {
  const energy = computeEnergyScore(loc.energy);
  const water = computeWaterScore(loc.water);
  const food = computeFoodScore(loc.food);
  const comfort = computeComfortScore(loc.comfort);
  const buffers = computeBuffersScore(loc.buffers);
  const land_water = computeLandWaterScore(loc.land_water);
  const overall =
    energy * 0.16 +
    water * 0.16 +
    food * 0.3 +
    comfort * 0.16 +
    buffers * 0.12 +
    land_water * 0.1;
  return { energy, water, food, comfort, buffers, land_water, overall };
}

export function computeWinterResult(
  loc: LocationProfile,
  people: number,
): WinterResult {
  const SCENARIO_DAYS = 14;

  // --- Winter-adjusted resource days ---
  const adjustedKwhUse = loc.energy.daily_kwh_use * 1.15;
  const energyDays = loc.energy.battery_kwh / Math.max(adjustedKwhUse, 0.1);

  const foodDays =
    (loc.food.stored_food_months * 30) / (Math.max(people, 1) * 1.15);

  const waterDays = loc.water.storage_gallons / (15 * Math.max(people, 1));

  const fuelDays = loc.buffers.fuel_reserve_days;

  // --- Winter score components ---
  // Battery autonomy (0–60)
  const batteryScore = Math.min(energyDays / SCENARIO_DAYS, 1) * 60;

  // Heat bonus
  const heatBonus: Record<string, number> = {
    wood: 20,
    mixed: 10,
    propane: 5,
    electric: -15,
  };
  const heatScore = heatBonus[loc.comfort.heat_type] ?? 0;

  // Water gravity bonus
  const waterGravityScore = loc.water.gravity_option ? 15 : -15;

  // Fuel buffer (0–20) — doubled importance means 28-day target
  const fuelScore = Math.min(fuelDays / 28, 1) * 20;

  // Food reserve (0–70)
  const foodReserveScore = Math.min(loc.food.stored_food_months / 6, 1) * 70;

  // Root cellar bonus
  const cellarBonus = loc.food.root_cellar ? 5 : 0;

  const rawScore =
    batteryScore +
    heatScore +
    waterGravityScore +
    fuelScore +
    foodReserveScore +
    cellarBonus;
  const winterScore = clamp(Math.round(rawScore), 0, 100);

  const winterLabel =
    winterScore >= 70
      ? "Calm Through Winter"
      : winterScore >= 45
        ? "Manageable"
        : "Strained";

  // Calm days = min of all 4 adjusted resource days
  const calmDays = Math.floor(
    Math.min(energyDays, foodDays, waterDays, fuelDays),
  );

  const resources: WinterResource[] = [
    {
      label: `Food supply (${people} ${people === 1 ? "person" : "people"}, +15% caloric demand)`,
      icon: "🌱",
      days: foodDays,
      scenarioDays: SCENARIO_DAYS,
      covered: foodDays >= SCENARIO_DAYS,
      note: "Caloric demand increased 15% for cold weather",
    },
    {
      label: `Water supply (${people} ${people === 1 ? "person" : "people"})`,
      icon: "💧",
      days: waterDays,
      scenarioDays: SCENARIO_DAYS,
      covered: waterDays >= SCENARIO_DAYS,
      note: loc.water.gravity_option
        ? "Gravity-fed — +15 pts bonus"
        : "No gravity feed — pump-dependent in freeze conditions",
    },
    {
      label: "Energy reserve (winter-adjusted)",
      icon: "⚡",
      days: energyDays,
      scenarioDays: SCENARIO_DAYS,
      covered: energyDays >= SCENARIO_DAYS,
      note: "Solar reduced 40% (5 low-solar days), usage +15%",
    },
    {
      label: "Fuel reserve (no delivery)",
      icon: "🔧",
      days: fuelDays,
      scenarioDays: SCENARIO_DAYS,
      covered: fuelDays >= SCENARIO_DAYS,
      note: "No fuel delivery for 14 days — existing reserves only",
    },
  ];

  return { winterScore, winterLabel, calmDays, resources };
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
    {
      label: "Improve irrigation access to good",
      apply: (l) => ({
        ...l,
        land_water: { ...l.land_water, access_for_irrigation: "good" as const },
      }),
    },
    {
      label: "Add a well (5 GPM, reliable)",
      apply: (l) => ({
        ...l,
        land_water: {
          ...l.land_water,
          has_well: true,
          well_gpm: 5,
          well_reliability: "medium" as const,
        },
      }),
    },
    {
      label: "Increase woods coverage to 50%",
      apply: (l) => ({
        ...l,
        land_water: {
          ...l.land_water,
          woods_percent: Math.max(l.land_water.woods_percent, 50),
        },
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

export function computeTopUpgrades(
  loc: LocationProfile,
  n: number,
): UpgradeSuggestion[] {
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
    {
      label: "+500 sq ft garden",
      apply: (l) => ({
        ...l,
        food: { ...l.food, garden_sqft: l.food.garden_sqft + 500 },
      }),
    },
    {
      label: "Upgrade to solid spare parts kit",
      apply: (l) => ({
        ...l,
        buffers: { ...l.buffers, spare_parts_kit: "solid" as const },
      }),
    },
    {
      label: "Upgrade filtration to excellent",
      apply: (l) => ({
        ...l,
        water: { ...l.water, filtration_level: "excellent" as const },
      }),
    },
    {
      label: "Add 6 more chickens",
      apply: (l) => ({
        ...l,
        food: {
          ...l.food,
          chickens_count: Math.min(12, l.food.chickens_count + 6),
        },
      }),
    },
    {
      label: "Improve irrigation access to good",
      apply: (l) => ({
        ...l,
        land_water: { ...l.land_water, access_for_irrigation: "good" as const },
      }),
    },
    {
      label: "Add a well (5 GPM, reliable)",
      apply: (l) => ({
        ...l,
        land_water: {
          ...l.land_water,
          has_well: true,
          well_gpm: 5,
          well_reliability: "medium" as const,
        },
      }),
    },
    {
      label: "Increase woods coverage to 50%",
      apply: (l) => ({
        ...l,
        land_water: {
          ...l.land_water,
          woods_percent: Math.max(l.land_water.woods_percent, 50),
        },
      }),
    },
  ];

  const results: UpgradeSuggestion[] = [];
  for (const upgrade of upgrades) {
    const modified = upgrade.apply(loc);
    const gain = computeOverallScore(modified) - baseScore;
    if (gain > 0.1) {
      results.push({ label: upgrade.label, gain });
    }
  }
  results.sort((a, b) => b.gain - a.gain);
  return results.slice(0, n);
}

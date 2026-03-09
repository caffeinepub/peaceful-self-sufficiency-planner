import type {
  FirewoodRole,
  HeatingFuelData,
  HeatingPriority,
  InsulationLevel,
  WinterTempBand,
} from "./types";

export const TEMP_FACTOR: Record<WinterTempBand, number> = {
  mild: 0.8,
  cool: 1.0,
  cold: 1.2,
  very_cold: 1.4,
};

export const INSULATION_FACTOR: Record<InsulationLevel, number> = {
  poor: 1.35,
  average: 1.0,
  good: 0.8,
  excellent: 0.65,
};

export const PRIORITY_FACTOR: Record<HeatingPriority, number> = {
  whole_house: 1.0,
  living_area: 0.6,
  survival_heat: 0.35,
};

export const ROLE_MULTIPLIER: Record<FirewoodRole, number> = {
  primary: 1.0,
  secondary: 0.5,
  occasional: 0.2,
};

export interface HeatingCoverageResult {
  woodDays: number;
  propaneHeatDays: number;
  totalDays: number;
  demandFactor: number;
  limiter: "Firewood" | "Propane" | "Both";
}

export function computeHeatingCoverage(
  fuel: HeatingFuelData,
): HeatingCoverageResult {
  const tempFactor = TEMP_FACTOR[fuel.winterTempBand ?? "cool"];
  const insulationFactor = INSULATION_FACTOR[fuel.insulation_level];
  const priorityFactor = PRIORITY_FACTOR[fuel.heating_priority];
  const demandFactor = priorityFactor * insulationFactor * tempFactor;

  const role = fuel.firewood_role ?? "primary";
  const roleMultiplier = ROLE_MULTIPLIER[role];
  const woodDays =
    demandFactor > 0
      ? ((fuel.firewood_cords * 7) / demandFactor) * roleMultiplier
      : 0;

  const tankSize =
    fuel.propane_tank_preset === "custom"
      ? fuel.propane_custom_gallons
      : fuel.propane_tank_preset;
  const usableGallons = tankSize * (fuel.propane_fill_percent / 100);

  // Use 30-day planning horizon to estimate how much propane non-heating uses consume
  const plannedDays = 30;
  const otherGallonsPerDay =
    (fuel.propane_uses_cooking ? 0.2 : 0) +
    (fuel.propane_uses_water_heater ? 0.5 : 0) +
    (fuel.propane_uses_generator ? 0.8 : 0);
  const propaneHeatGallonsPerDay = fuel.propane_uses_heating
    ? 2.0 * demandFactor
    : 0;
  const usableForHeat = Math.max(
    usableGallons - otherGallonsPerDay * plannedDays,
    0,
  );
  const propaneHeatDays =
    fuel.propane_uses_heating && propaneHeatGallonsPerDay > 0
      ? usableForHeat / propaneHeatGallonsPerDay
      : 0;

  let totalDays: number;
  if (role === "primary") {
    totalDays = woodDays + propaneHeatDays;
  } else if (role === "secondary") {
    totalDays = propaneHeatDays + woodDays;
  } else {
    // occasional
    totalDays = propaneHeatDays + woodDays * 0.3;
  }

  // Primary limiter
  let limiter: "Firewood" | "Propane" | "Both";
  if (propaneHeatDays === 0 && woodDays === 0) {
    limiter = "Both";
  } else if (propaneHeatDays === 0) {
    limiter = "Firewood";
  } else if (woodDays === 0) {
    limiter = "Propane";
  } else {
    const ratio = woodDays / Math.max(propaneHeatDays, 0.001);
    limiter = ratio < 0.7 ? "Firewood" : ratio > 1.43 ? "Propane" : "Both";
  }

  return { woodDays, propaneHeatDays, totalDays, demandFactor, limiter };
}

export function computeBestImprovement(fuel: HeatingFuelData): {
  label: string;
  addedDays: number;
} {
  const base = computeHeatingCoverage(fuel);
  const candidates: { label: string; addedDays: number }[] = [];

  // +1 cord
  const withCord = computeHeatingCoverage({
    ...fuel,
    firewood_cords: fuel.firewood_cords + 1,
  });
  candidates.push({
    label: "Add 1 cord of firewood",
    addedDays: withCord.totalDays - base.totalDays,
  });

  // +25% fill
  const newFill = Math.min(100, fuel.propane_fill_percent + 25);
  if (newFill > fuel.propane_fill_percent) {
    const withFill = computeHeatingCoverage({
      ...fuel,
      propane_fill_percent: newFill,
    });
    candidates.push({
      label: "Fill propane +25%",
      addedDays: withFill.totalDays - base.totalDays,
    });
  }

  // Reduce heating priority one step
  const priorityOrder: HeatingPriority[] = [
    "whole_house",
    "living_area",
    "survival_heat",
  ];
  const pIdx = priorityOrder.indexOf(fuel.heating_priority);
  if (pIdx < priorityOrder.length - 1) {
    const nextPriority = priorityOrder[pIdx + 1];
    const priorityLabels: Record<HeatingPriority, string> = {
      whole_house: "Switch to Main Living Area heat only",
      living_area: "Switch to Survival Heat mode",
      survival_heat: "Switch to Survival Heat mode",
    };
    const withPriority = computeHeatingCoverage({
      ...fuel,
      heating_priority: nextPriority,
    });
    candidates.push({
      label: priorityLabels[fuel.heating_priority],
      addedDays: withPriority.totalDays - base.totalDays,
    });
  }

  // Improve insulation one step
  const insulationOrder: InsulationLevel[] = [
    "poor",
    "average",
    "good",
    "excellent",
  ];
  const iIdx = insulationOrder.indexOf(fuel.insulation_level);
  if (iIdx < insulationOrder.length - 1) {
    const nextInsulation = insulationOrder[iIdx + 1];
    const insulationLabels: Record<InsulationLevel, string> = {
      poor: "Improve insulation to Average",
      average: "Improve insulation to Good",
      good: "Improve insulation to Excellent",
      excellent: "Improve insulation to Excellent",
    };
    const withInsulation = computeHeatingCoverage({
      ...fuel,
      insulation_level: nextInsulation,
    });
    candidates.push({
      label: insulationLabels[fuel.insulation_level],
      addedDays: withInsulation.totalDays - base.totalDays,
    });
  }

  candidates.sort((a, b) => b.addedDays - a.addedDays);
  return candidates[0] ?? { label: "All options maximized", addedDays: 0 };
}

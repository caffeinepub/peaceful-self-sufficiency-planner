export type PrimarySource = "well" | "spring" | "city" | "rain";
export type FiltrationLevel = "basic" | "good" | "excellent";
export type HeatType = "electric" | "propane" | "wood" | "mixed";
export type CookingType = "electric" | "gas" | "wood" | "mixed";
export type SparePartsKit = "none" | "basic" | "solid";

export type WaterType =
  | "none"
  | "stream"
  | "creek"
  | "river"
  | "lake"
  | "pond"
  | "multiple";
export type WaterSizeClass = "tiny" | "small" | "medium" | "large";
export type WaterReliability = "seasonal" | "intermittent" | "year_round";
export type IrrigationAccess = "none" | "limited" | "good" | "excellent";
export type FishPresent = "unknown" | "none" | "some" | "good";
export type DucksGeesePresent = "unknown" | "none" | "seasonal" | "frequent";
export type DeerSign = "unknown" | "none" | "occasional" | "frequent";
export type OtherGame =
  | "turkey"
  | "rabbit"
  | "squirrel"
  | "hog"
  | "bear"
  | "none"
  | "unknown";
export type WellReliability = "unknown" | "low" | "medium" | "high";

export interface LandWaterPillar {
  has_surface_water: boolean;
  water_type: WaterType;
  water_size_class: WaterSizeClass;
  water_reliability: WaterReliability;
  access_for_irrigation: IrrigationAccess;
  fish_present: FishPresent;
  ducks_geese_present: DucksGeesePresent;
  woods_percent: number; // 0-100
  deer_sign: DeerSign;
  other_game: OtherGame[];
  has_well: boolean;
  well_gpm: number;
  well_depth_ft?: number;
  well_reliability: WellReliability;
}

export interface EnergyPillar {
  solar_kw: number;
  battery_kwh: number;
  generator: boolean;
  winter_sun_hours: number; // 1–6
  daily_kwh_use: number;
}

export interface WaterPillar {
  primary_source: PrimarySource;
  storage_gallons: number;
  gravity_option: boolean;
  filtration_level: FiltrationLevel;
}

export interface FoodPillar {
  garden_sqft: number;
  chickens_count: number;
  goats_count: number;
  root_cellar: boolean;
  stored_food_months: number; // 0–12
}

export interface ComfortPillar {
  heat_type: HeatType;
  cooking_type: CookingType;
  backup_heat: boolean;
  backup_cooking: boolean;
}

export interface BuffersPillar {
  fuel_reserve_days: number;
  feed_reserve_days: number;
  spare_parts_kit: SparePartsKit;
  tools_completeness: number; // 0–100
  resupply_trips_per_month: number;
}

export type PropaneTankPreset = 100 | 250 | 500 | 1000 | "custom";
export type InsulationLevel = "poor" | "average" | "good" | "excellent";
export type HeatingPriority = "whole_house" | "living_area" | "survival_heat";

export interface HeatingFuelData {
  firewood_cords: number;
  propane_tank_preset: PropaneTankPreset;
  propane_custom_gallons: number;
  propane_fill_percent: number; // 0-100
  heated_sqft: number;
  insulation_level: InsulationLevel;
  heating_priority: HeatingPriority;
  propane_uses_heating: boolean;
  propane_uses_cooking: boolean;
  propane_uses_water_heater: boolean;
  propane_uses_generator: boolean;
}

export interface LocationProfile {
  id: string;
  name: string;
  state: string;
  notes: string;
  created_at: string;
  updated_at: string;
  energy: EnergyPillar;
  water: WaterPillar;
  food: FoodPillar;
  comfort: ComfortPillar;
  buffers: BuffersPillar;
  land_water: LandWaterPillar;
  heating_fuel: HeatingFuelData;
}

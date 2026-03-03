export type PrimarySource = "well" | "spring" | "city" | "rain";
export type FiltrationLevel = "basic" | "good" | "excellent";
export type HeatType = "electric" | "propane" | "wood" | "mixed";
export type CookingType = "electric" | "gas" | "wood" | "mixed";
export type SparePartsKit = "none" | "basic" | "solid";

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
}

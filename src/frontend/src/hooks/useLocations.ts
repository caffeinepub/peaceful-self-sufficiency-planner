import { useCallback, useEffect, useState } from "react";
import { SEED_LOCATIONS } from "../seedData";
import type {
  HeatingFuelData,
  LandProductivityData,
  LandWaterPillar,
  LocationProfile,
} from "../types";

const STORAGE_KEY = "pss_locations";
const THEME_KEY = "pss_theme";

const DEFAULT_LAND_WATER: LandWaterPillar = {
  has_surface_water: false,
  water_type: "none",
  water_size_class: "small",
  water_reliability: "seasonal",
  access_for_irrigation: "none",
  fish_present: "unknown",
  ducks_geese_present: "unknown",
  woods_percent: 0,
  deer_sign: "unknown",
  other_game: [],
  has_well: false,
  well_gpm: 0,
  well_depth_ft: undefined,
  well_reliability: "unknown",
};

export const DEFAULT_HEATING_FUEL: HeatingFuelData = {
  firewood_cords: 2,
  max_firewood_storage: 0,
  propane_tank_preset: 100,
  propane_custom_gallons: 0,
  propane_fill_percent: 50,
  heated_sqft: 1200,
  insulation_level: "average",
  heating_priority: "whole_house",
  firewood_role: "primary",
  propane_uses_heating: false,
  propane_uses_cooking: true,
  propane_uses_water_heater: false,
  propane_uses_generator: false,
  winterTempBand: "cool",
  snowDisruption: "occasional",
};

const DEFAULT_LAND_PRODUCTIVITY: LandProductivityData = {
  fruit_trees: "none",
  wooded_acres: 0,
  pasture_acres: 0,
};

function generateId(): string {
  return `loc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function migrateLocation(loc: LocationProfile): LocationProfile {
  const hf = loc.heating_fuel ?? DEFAULT_HEATING_FUEL;
  // Migrate legacy buffers (strip tools_completeness if present)
  const legacyBuffers = loc.buffers as LocationProfile["buffers"] & {
    tools_completeness?: number;
  };
  const buffers: LocationProfile["buffers"] = {
    fuel_reserve_days: legacyBuffers.fuel_reserve_days ?? 0,
    feed_reserve_days: legacyBuffers.feed_reserve_days ?? 0,
    spare_parts_kit: legacyBuffers.spare_parts_kit ?? "none",
    resupply_trips_per_month: legacyBuffers.resupply_trips_per_month ?? 4,
  };

  return {
    ...loc,
    buffers,
    land_water: loc.land_water ?? DEFAULT_LAND_WATER,
    heating_fuel: {
      ...DEFAULT_HEATING_FUEL,
      ...hf,
      firewood_role: hf.firewood_role ?? "primary",
      // Migrate top-level winterTempBand/snowDisruption into heating_fuel
      winterTempBand: hf.winterTempBand ?? loc.winterTempBand ?? "cool",
      snowDisruption: hf.snowDisruption ?? loc.snowDisruption ?? "occasional",
    },
    land_productivity: loc.land_productivity ?? DEFAULT_LAND_PRODUCTIVITY,
  };
}

function loadLocations(): LocationProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_LOCATIONS));
      return SEED_LOCATIONS;
    }
    const parsed = JSON.parse(raw) as LocationProfile[];
    return parsed.map(migrateLocation);
  } catch {
    return SEED_LOCATIONS;
  }
}

function saveLocations(locations: LocationProfile[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(locations));
}

export function useLocations() {
  const [locations, setLocations] = useState<LocationProfile[]>(loadLocations);

  const persist = useCallback((locs: LocationProfile[]) => {
    setLocations(locs);
    saveLocations(locs);
  }, []);

  const addLocation = useCallback(
    (data: Omit<LocationProfile, "id" | "created_at" | "updated_at">) => {
      const now = new Date().toISOString();
      const newLoc: LocationProfile = {
        ...data,
        id: generateId(),
        created_at: now,
        updated_at: now,
      };
      persist([...locations, newLoc]);
      return newLoc;
    },
    [locations, persist],
  );

  const updateLocation = useCallback(
    (id: string, data: Partial<Omit<LocationProfile, "id" | "created_at">>) => {
      const updated = locations.map((loc) =>
        loc.id === id
          ? { ...loc, ...data, updated_at: new Date().toISOString() }
          : loc,
      );
      persist(updated);
    },
    [locations, persist],
  );

  const deleteLocation = useCallback(
    (id: string) => {
      persist(locations.filter((loc) => loc.id !== id));
    },
    [locations, persist],
  );

  const duplicateLocation = useCallback(
    (id: string) => {
      const source = locations.find((loc) => loc.id === id);
      if (!source) return;
      const now = new Date().toISOString();
      const copy: LocationProfile = {
        ...source,
        id: generateId(),
        name: `${source.name} (copy)`,
        created_at: now,
        updated_at: now,
      };
      persist([...locations, copy]);
    },
    [locations, persist],
  );

  const getLocation = useCallback(
    (id: string) => locations.find((loc) => loc.id === id),
    [locations],
  );

  const exportAll = useCallback(() => {
    const blob = new Blob([JSON.stringify(locations, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pss-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [locations]);

  const importLocations = useCallback(
    (imported: LocationProfile[], mode: "replace" | "merge" = "merge") => {
      if (mode === "replace") {
        persist(imported);
      } else {
        const existing = new Map(locations.map((l) => [l.id, l]));
        for (const loc of imported) {
          existing.set(loc.id, loc);
        }
        persist(Array.from(existing.values()));
      }
    },
    [locations, persist],
  );

  return {
    locations,
    addLocation,
    updateLocation,
    deleteLocation,
    duplicateLocation,
    getLocation,
    exportAll,
    importLocations,
  };
}

export function useTheme() {
  const [theme, setThemeState] = useState<"light" | "dark">(() => {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "dark" || stored === "light") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  return { theme, toggleTheme };
}

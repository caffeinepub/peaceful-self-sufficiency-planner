import { useCallback, useEffect, useState } from "react";
import { SEED_LOCATIONS } from "../seedData";
import type { LocationProfile } from "../types";

const STORAGE_KEY = "pss_locations";
const THEME_KEY = "pss_theme";

function generateId(): string {
  return `loc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function loadLocations(): LocationProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_LOCATIONS));
      return SEED_LOCATIONS;
    }
    return JSON.parse(raw) as LocationProfile[];
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

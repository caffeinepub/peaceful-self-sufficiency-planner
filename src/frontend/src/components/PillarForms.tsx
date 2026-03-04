import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useState } from "react";
import type {
  BuffersPillar,
  ComfortPillar,
  EnergyPillar,
  FirewoodRole,
  FoodPillar,
  HeatingFuelData,
  HeatingPriority,
  InsulationLevel,
  LandWaterPillar,
  OtherGame,
  PropaneTankPreset,
  SnowDisruption,
  WaterPillar,
  WinterTempBand,
} from "../types";

// ── Energy Pillar ──────────────────────────────────────────────────────────────

interface EnergyFormProps {
  value: EnergyPillar;
  onChange: (v: EnergyPillar) => void;
}

export function EnergyForm({ value, onChange }: EnergyFormProps) {
  const set = <K extends keyof EnergyPillar>(key: K, val: EnergyPillar[K]) =>
    onChange({ ...value, [key]: val });

  const [hasSolar, setHasSolar] = useState<boolean>(value.solar_kw > 0);
  const [solarKwDraft, setSolarKwDraft] = useState<number>(
    value.solar_kw > 0 ? value.solar_kw : 1,
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Solar Toggle */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30 border border-border col-span-full sm:col-span-1">
        <div>
          <Label htmlFor="solar-toggle" className="font-medium cursor-pointer">
            Solar Panels
          </Label>
          <p className="text-xs text-muted-foreground">
            Have solar / don't have solar
          </p>
        </div>
        <Switch
          id="solar-toggle"
          checked={hasSolar}
          onCheckedChange={(v) => {
            setHasSolar(v);
            if (v) {
              onChange({ ...value, solar_kw: solarKwDraft });
            } else {
              onChange({ ...value, solar_kw: 0, battery_kwh: 0 });
            }
          }}
          data-ocid="energy.solar_toggle"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="solar-kw">Solar Capacity (kW)</Label>
        <Input
          id="solar-kw"
          type="number"
          min={0}
          max={100}
          step={0.5}
          value={hasSolar ? value.solar_kw : 0}
          disabled={!hasSolar}
          onChange={(e) => {
            const num = Number(e.target.value);
            setSolarKwDraft(num);
            set("solar_kw", num);
          }}
          className={!hasSolar ? "opacity-50 cursor-not-allowed" : ""}
        />
        <p className="text-xs text-muted-foreground">
          Total solar array wattage in kilowatts
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="battery-kwh">Battery Storage (kWh)</Label>
        <Input
          id="battery-kwh"
          type="number"
          min={0}
          max={500}
          step={1}
          value={value.battery_kwh}
          onChange={(e) => set("battery_kwh", Number(e.target.value))}
        />
        <p className="text-xs text-muted-foreground">
          Total usable battery bank capacity
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="daily-kwh">Daily Usage (kWh)</Label>
        <Input
          id="daily-kwh"
          type="number"
          min={0.5}
          max={100}
          step={0.5}
          value={value.daily_kwh_use}
          onChange={(e) => set("daily_kwh_use", Number(e.target.value))}
        />
        <p className="text-xs text-muted-foreground">
          Average daily household consumption
        </p>
      </div>

      <div className="space-y-3">
        <Label>
          Winter Sun Hours: {value.winter_sun_hours.toFixed(1)} hrs/day
        </Label>
        <Slider
          min={1}
          max={6}
          step={0.5}
          value={[value.winter_sun_hours]}
          onValueChange={([v]) => set("winter_sun_hours", v)}
          className="mt-2"
        />
        <p className="text-xs text-muted-foreground">
          Peak sun hours in winter months
        </p>
      </div>

      <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30 border border-border col-span-full sm:col-span-1">
        <div>
          <Label
            htmlFor="generator-toggle"
            className="font-medium cursor-pointer"
          >
            Generator
          </Label>
          <p className="text-xs text-muted-foreground">
            Backup generator available
          </p>
        </div>
        <Switch
          id="generator-toggle"
          checked={value.generator}
          onCheckedChange={(v) => set("generator", v)}
        />
      </div>
    </div>
  );
}

// ── Water Pillar ───────────────────────────────────────────────────────────────

interface WaterFormProps {
  value: WaterPillar;
  onChange: (v: WaterPillar) => void;
}

export function WaterForm({ value, onChange }: WaterFormProps) {
  const set = <K extends keyof WaterPillar>(key: K, val: WaterPillar[K]) =>
    onChange({ ...value, [key]: val });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <Label>Primary Water Source</Label>
        <Select
          value={value.primary_source}
          onValueChange={(v) =>
            set("primary_source", v as WaterPillar["primary_source"])
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="well">🪣 Well</SelectItem>
            <SelectItem value="spring">🌊 Spring</SelectItem>
            <SelectItem value="city">🏙️ City / Municipal</SelectItem>
            <SelectItem value="rain">🌧️ Rainwater</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="filtration">Filtration Level</Label>
        <Select
          value={value.filtration_level}
          onValueChange={(v) =>
            set("filtration_level", v as WaterPillar["filtration_level"])
          }
        >
          <SelectTrigger id="filtration">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="basic">Basic filter</SelectItem>
            <SelectItem value="good">Good (multi-stage)</SelectItem>
            <SelectItem value="excellent">Excellent (full system)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="storage-gallons">Storage Capacity (gallons)</Label>
        <Input
          id="storage-gallons"
          type="number"
          min={0}
          max={50000}
          step={50}
          value={value.storage_gallons}
          onChange={(e) => set("storage_gallons", Number(e.target.value))}
        />
        <p className="text-xs text-muted-foreground">
          Total tank/cistern storage
        </p>
      </div>

      <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30 border border-border">
        <div>
          <Label
            htmlFor="gravity-toggle"
            className="font-medium cursor-pointer"
          >
            Gravity-Fed Option
          </Label>
          <p className="text-xs text-muted-foreground">
            Water flows without a pump
          </p>
        </div>
        <Switch
          id="gravity-toggle"
          checked={value.gravity_option}
          onCheckedChange={(v) => set("gravity_option", v)}
        />
      </div>
    </div>
  );
}

// ── Food Pillar ────────────────────────────────────────────────────────────────

interface FoodFormProps {
  value: FoodPillar;
  onChange: (v: FoodPillar) => void;
}

export function FoodForm({ value, onChange }: FoodFormProps) {
  const set = <K extends keyof FoodPillar>(key: K, val: FoodPillar[K]) =>
    onChange({ ...value, [key]: val });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <Label htmlFor="garden-sqft">Garden Area (sq ft)</Label>
        <Input
          id="garden-sqft"
          type="number"
          min={0}
          max={10000}
          step={50}
          value={value.garden_sqft}
          onChange={(e) => set("garden_sqft", Number(e.target.value))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="chickens">Chickens</Label>
        <Input
          id="chickens"
          type="number"
          min={0}
          max={200}
          step={1}
          value={value.chickens_count}
          onChange={(e) => set("chickens_count", Number(e.target.value))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="goats">Goats</Label>
        <Input
          id="goats"
          type="number"
          min={0}
          max={50}
          step={1}
          value={value.goats_count}
          onChange={(e) => set("goats_count", Number(e.target.value))}
        />
      </div>

      <div className="space-y-3">
        <Label>
          Stored Food: {value.stored_food_months} month
          {value.stored_food_months !== 1 ? "s" : ""}
        </Label>
        <Slider
          min={0}
          max={12}
          step={0.5}
          value={[value.stored_food_months]}
          onValueChange={([v]) => set("stored_food_months", v)}
        />
        <p className="text-xs text-muted-foreground">
          Months of preserved/stored food on hand
        </p>
      </div>

      <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30 border border-border col-span-full sm:col-span-1">
        <div>
          <Label
            htmlFor="root-cellar-toggle"
            className="font-medium cursor-pointer"
          >
            Root Cellar
          </Label>
          <p className="text-xs text-muted-foreground">
            Underground food storage available
          </p>
        </div>
        <Switch
          id="root-cellar-toggle"
          checked={value.root_cellar}
          onCheckedChange={(v) => set("root_cellar", v)}
        />
      </div>
    </div>
  );
}

// ── Comfort Pillar ─────────────────────────────────────────────────────────────

interface ComfortFormProps {
  value: ComfortPillar;
  onChange: (v: ComfortPillar) => void;
}

export function ComfortForm({ value, onChange }: ComfortFormProps) {
  const set = <K extends keyof ComfortPillar>(key: K, val: ComfortPillar[K]) =>
    onChange({ ...value, [key]: val });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <Label>Primary Heat Source</Label>
        <Select
          value={value.heat_type}
          onValueChange={(v) =>
            set("heat_type", v as ComfortPillar["heat_type"])
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="electric">⚡ Electric</SelectItem>
            <SelectItem value="propane">🔵 Propane</SelectItem>
            <SelectItem value="wood">🪵 Wood</SelectItem>
            <SelectItem value="mixed">🔀 Mixed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Primary Cooking Source</Label>
        <Select
          value={value.cooking_type}
          onValueChange={(v) =>
            set("cooking_type", v as ComfortPillar["cooking_type"])
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="electric">⚡ Electric</SelectItem>
            <SelectItem value="gas">🔵 Gas</SelectItem>
            <SelectItem value="wood">🪵 Wood</SelectItem>
            <SelectItem value="mixed">🔀 Mixed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30 border border-border">
        <div>
          <Label
            htmlFor="backup-heat-toggle"
            className="font-medium cursor-pointer"
          >
            Backup Heat
          </Label>
          <p className="text-xs text-muted-foreground">
            Secondary heat source available
          </p>
        </div>
        <Switch
          id="backup-heat-toggle"
          checked={value.backup_heat}
          onCheckedChange={(v) => set("backup_heat", v)}
        />
      </div>

      <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30 border border-border">
        <div>
          <Label
            htmlFor="backup-cooking-toggle"
            className="font-medium cursor-pointer"
          >
            Backup Cooking
          </Label>
          <p className="text-xs text-muted-foreground">
            Secondary cooking method available
          </p>
        </div>
        <Switch
          id="backup-cooking-toggle"
          checked={value.backup_cooking}
          onCheckedChange={(v) => set("backup_cooking", v)}
        />
      </div>
    </div>
  );
}

// ── Buffers Pillar ─────────────────────────────────────────────────────────────

interface BuffersFormProps {
  value: BuffersPillar;
  onChange: (v: BuffersPillar) => void;
}

export function BuffersForm({ value, onChange }: BuffersFormProps) {
  const set = <K extends keyof BuffersPillar>(key: K, val: BuffersPillar[K]) =>
    onChange({ ...value, [key]: val });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <Label htmlFor="fuel-reserve">Fuel Reserve (days)</Label>
        <Input
          id="fuel-reserve"
          type="number"
          min={0}
          max={365}
          step={1}
          value={value.fuel_reserve_days}
          onChange={(e) => set("fuel_reserve_days", Number(e.target.value))}
        />
        <p className="text-xs text-muted-foreground">
          Propane, firewood, or generator fuel
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="feed-reserve">Animal Feed Reserve (days)</Label>
        <Input
          id="feed-reserve"
          type="number"
          min={0}
          max={365}
          step={1}
          value={value.feed_reserve_days}
          onChange={(e) => set("feed_reserve_days", Number(e.target.value))}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Spare Parts Kit</Label>
        <Select
          value={value.spare_parts_kit}
          onValueChange={(v) =>
            set("spare_parts_kit", v as BuffersPillar["spare_parts_kit"])
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="basic">Basic essentials</SelectItem>
            <SelectItem value="solid">Solid kit (well-stocked)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="resupply-trips">Resupply Trips / Month</Label>
        <Input
          id="resupply-trips"
          type="number"
          min={0}
          max={30}
          step={1}
          value={value.resupply_trips_per_month}
          onChange={(e) =>
            set("resupply_trips_per_month", Number(e.target.value))
          }
        />
        <p className="text-xs text-muted-foreground">
          Fewer trips = more self-sufficient
        </p>
      </div>
    </div>
  );
}

// ── Land & Water Ecology Pillar ────────────────────────────────────────────────

interface LandWaterFormProps {
  value: LandWaterPillar;
  onChange: (v: LandWaterPillar) => void;
}

const OTHER_GAME_OPTIONS: { value: OtherGame; label: string }[] = [
  { value: "turkey", label: "🦃 Turkey" },
  { value: "rabbit", label: "🐇 Rabbit" },
  { value: "squirrel", label: "🐿️ Squirrel" },
  { value: "hog", label: "🐗 Hog" },
  { value: "bear", label: "🐻 Bear" },
  { value: "none", label: "None observed" },
  { value: "unknown", label: "Not sure yet" },
];

export function LandWaterForm({ value, onChange }: LandWaterFormProps) {
  const set = <K extends keyof LandWaterPillar>(
    key: K,
    val: LandWaterPillar[K],
  ) => onChange({ ...value, [key]: val });

  const toggleGame = (game: OtherGame) => {
    const current = value.other_game;
    if (current.includes(game)) {
      onChange({ ...value, other_game: current.filter((g) => g !== game) });
    } else {
      onChange({ ...value, other_game: [...current, game] });
    }
  };

  return (
    <div className="space-y-5">
      {/* ── Surface Water ── */}
      <div className="space-y-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Surface Water
        </p>

        {/* Has surface water toggle */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30 border border-border">
          <div>
            <Label
              htmlFor="lw-surface-water-toggle"
              className="font-medium cursor-pointer"
            >
              Does the property have surface water?
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Creeks, rivers, ponds, lakes — any natural water on the land.
            </p>
          </div>
          <Switch
            id="lw-surface-water-toggle"
            checked={value.has_surface_water}
            onCheckedChange={(v) => set("has_surface_water", v)}
            data-ocid="land_water.surface_water.switch"
          />
        </div>

        {/* Water detail fields — shown only when surface water present */}
        {value.has_surface_water && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-1">
            <div className="space-y-1.5">
              <Label>What type of water is it?</Label>
              <Select
                value={value.water_type}
                onValueChange={(v) =>
                  set("water_type", v as LandWaterPillar["water_type"])
                }
              >
                <SelectTrigger data-ocid="land_water.water_type.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="creek">🏞️ Creek</SelectItem>
                  <SelectItem value="stream">💧 Stream</SelectItem>
                  <SelectItem value="river">🌊 River</SelectItem>
                  <SelectItem value="lake">🏔️ Lake</SelectItem>
                  <SelectItem value="pond">🐸 Pond</SelectItem>
                  <SelectItem value="multiple">🗺️ Multiple types</SelectItem>
                  <SelectItem value="none">— None / unsure</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Rivers and lakes score higher than smaller sources.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>How big is it roughly?</Label>
              <Select
                value={value.water_size_class}
                onValueChange={(v) =>
                  set(
                    "water_size_class",
                    v as LandWaterPillar["water_size_class"],
                  )
                }
              >
                <SelectTrigger data-ocid="land_water.water_size.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tiny">
                    Tiny (trickle / small pool)
                  </SelectItem>
                  <SelectItem value="small">Small (wading depth)</SelectItem>
                  <SelectItem value="medium">Medium (swim-able)</SelectItem>
                  <SelectItem value="large">Large (boatable)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Size affects irrigation and wildlife habitat potential.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Is it reliable year-round?</Label>
              <Select
                value={value.water_reliability}
                onValueChange={(v) =>
                  set(
                    "water_reliability",
                    v as LandWaterPillar["water_reliability"],
                  )
                }
              >
                <SelectTrigger data-ocid="land_water.water_reliability.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="year_round">
                    ✅ Year-round (always flowing)
                  </SelectItem>
                  <SelectItem value="intermittent">
                    🔄 Intermittent (most of the year)
                  </SelectItem>
                  <SelectItem value="seasonal">
                    🍂 Seasonal (spring / rainy season only)
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Year-round water is significantly more valuable for resilience.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Can you use it for irrigation?</Label>
              <Select
                value={value.access_for_irrigation}
                onValueChange={(v) =>
                  set(
                    "access_for_irrigation",
                    v as LandWaterPillar["access_for_irrigation"],
                  )
                }
              >
                <SelectTrigger data-ocid="land_water.irrigation.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">❌ No access</SelectItem>
                  <SelectItem value="limited">⚠️ Limited (difficult)</SelectItem>
                  <SelectItem value="good">✅ Good access</SelectItem>
                  <SelectItem value="excellent">
                    🌟 Excellent (gravity-fed possible)
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Irrigation access multiplies food production potential.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Are there fish present?</Label>
              <Select
                value={value.fish_present}
                onValueChange={(v) =>
                  set("fish_present", v as LandWaterPillar["fish_present"])
                }
              >
                <SelectTrigger data-ocid="land_water.fish.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="good">🐟 Good population</SelectItem>
                  <SelectItem value="some">🎣 Some fish</SelectItem>
                  <SelectItem value="none">🚫 No fish</SelectItem>
                  <SelectItem value="unknown">❓ Not sure</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Fish are a significant protein source in a quiet week.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Do ducks or geese visit?</Label>
              <Select
                value={value.ducks_geese_present}
                onValueChange={(v) =>
                  set(
                    "ducks_geese_present",
                    v as LandWaterPillar["ducks_geese_present"],
                  )
                }
              >
                <SelectTrigger data-ocid="land_water.waterfowl.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="frequent">🦆 Frequently</SelectItem>
                  <SelectItem value="seasonal">🍂 Seasonally</SelectItem>
                  <SelectItem value="none">🚫 Not seen</SelectItem>
                  <SelectItem value="unknown">❓ Not sure</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Waterfowl indicate healthy wetland habitat.
              </p>
            </div>
          </div>
        )}

        {/* Irrigation access shown even without surface water */}
        {!value.has_surface_water && (
          <div className="space-y-1.5">
            <Label>Any irrigation water access on the property?</Label>
            <Select
              value={value.access_for_irrigation}
              onValueChange={(v) =>
                set(
                  "access_for_irrigation",
                  v as LandWaterPillar["access_for_irrigation"],
                )
              }
            >
              <SelectTrigger data-ocid="land_water.irrigation.select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">❌ None</SelectItem>
                <SelectItem value="limited">⚠️ Limited</SelectItem>
                <SelectItem value="good">✅ Good</SelectItem>
                <SelectItem value="excellent">🌟 Excellent</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Irrigation access from any source, including hauled water or
              storage tanks.
            </p>
          </div>
        )}
      </div>

      {/* ── Land & Habitat ── */}
      <div className="space-y-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Land &amp; Habitat
        </p>

        <div className="space-y-2">
          <Label>
            About what percent of the land is wooded? —{" "}
            <span className="text-primary font-semibold">
              {value.woods_percent}%
            </span>
          </Label>
          <Slider
            min={0}
            max={100}
            step={5}
            value={[value.woods_percent]}
            onValueChange={([v]) => set("woods_percent", v)}
            data-ocid="land_water.woods.input"
          />
          <p className="text-xs text-muted-foreground">
            Woods provide firewood, wildlife habitat, privacy, and wind
            protection.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label>Do you see deer signs on the property?</Label>
          <Select
            value={value.deer_sign}
            onValueChange={(v) =>
              set("deer_sign", v as LandWaterPillar["deer_sign"])
            }
          >
            <SelectTrigger data-ocid="land_water.deer.select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="frequent">
                🦌 Frequently (tracks, beds)
              </SelectItem>
              <SelectItem value="occasional">👣 Occasionally</SelectItem>
              <SelectItem value="none">🚫 Rarely or never</SelectItem>
              <SelectItem value="unknown">❓ Haven't looked</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Deer sign indicates good habitat connectivity and food resources
            nearby.
          </p>
        </div>

        <div className="space-y-2">
          <Label>What other wildlife have you noticed?</Label>
          <div className="grid grid-cols-2 gap-2 pt-1">
            {OTHER_GAME_OPTIONS.map(({ value: gameVal, label }) => {
              const checked = value.other_game.includes(gameVal);
              const checkId = `lw-game-${gameVal}`;
              return (
                <label
                  key={gameVal}
                  htmlFor={checkId}
                  className="flex items-center gap-2.5 cursor-pointer select-none p-2 rounded-lg hover:bg-accent/30 transition-colors"
                >
                  <Checkbox
                    id={checkId}
                    checked={checked}
                    onCheckedChange={() => toggleGame(gameVal)}
                    data-ocid="land_water.game.checkbox"
                  />
                  <span className="text-sm">{label}</span>
                </label>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            Wild game diversity signals a productive, healthy ecosystem.
          </p>
        </div>
      </div>

      {/* ── Well ── */}
      <div className="space-y-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Well Water
        </p>

        <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30 border border-border">
          <div>
            <Label
              htmlFor="lw-well-toggle"
              className="font-medium cursor-pointer"
            >
              Is there a drilled well on the property?
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Even a modest well greatly improves water independence.
            </p>
          </div>
          <Switch
            id="lw-well-toggle"
            checked={value.has_well}
            onCheckedChange={(v) => set("has_well", v)}
            data-ocid="land_water.well.switch"
          />
        </div>

        {value.has_well && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-1">
            <div className="space-y-1.5">
              <Label htmlFor="lw-well-gpm">
                How fast does it flow? (gallons per minute)
              </Label>
              <Input
                id="lw-well-gpm"
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={value.well_gpm}
                onChange={(e) => set("well_gpm", Number(e.target.value))}
                data-ocid="land_water.well_gpm.input"
              />
              <p className="text-xs text-muted-foreground">
                1 GPM is low but workable; 5+ is solid; 10+ is excellent.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="lw-well-depth">
                How deep is it? (feet, optional)
              </Label>
              <Input
                id="lw-well-depth"
                type="number"
                min={0}
                max={2000}
                step={10}
                value={value.well_depth_ft ?? ""}
                placeholder="e.g. 120"
                onChange={(e) =>
                  set(
                    "well_depth_ft",
                    e.target.value === "" ? undefined : Number(e.target.value),
                  )
                }
                data-ocid="land_water.well_depth.input"
              />
              <p className="text-xs text-muted-foreground">
                Deeper wells are usually more reliable. Leave blank if unknown.
              </p>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label>How reliable has it been?</Label>
              <Select
                value={value.well_reliability}
                onValueChange={(v) =>
                  set(
                    "well_reliability",
                    v as LandWaterPillar["well_reliability"],
                  )
                }
              >
                <SelectTrigger data-ocid="land_water.well_reliability.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">
                    ✅ High — never had issues
                  </SelectItem>
                  <SelectItem value="medium">
                    🔄 Medium — occasional low-flow periods
                  </SelectItem>
                  <SelectItem value="low">
                    ⚠️ Low — drought-sensitive or unreliable
                  </SelectItem>
                  <SelectItem value="unknown">❓ Don't know yet</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Reliability determines how much you can count on the well during
                dry seasons.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Heating Fuel & House Context ───────────────────────────────────────────────

interface HeatingFuelFormProps {
  value: HeatingFuelData;
  onChange: (v: HeatingFuelData) => void;
}

const WINTER_TEMP_OPTIONS: {
  value: WinterTempBand;
  label: string;
}[] = [
  { value: "mild", label: "Mild (35–45°F)" },
  { value: "cool", label: "Cool (25–35°F)" },
  { value: "cold", label: "Cold (15–25°F)" },
  { value: "very_cold", label: "Very cold (<15°F)" },
];

const SNOW_OPTIONS: { value: SnowDisruption; label: string }[] = [
  { value: "rare", label: "Rare" },
  { value: "occasional", label: "Occasional" },
  { value: "regular", label: "Regular" },
  { value: "heavy", label: "Heavy" },
];

const FIREWOOD_ROLE_OPTIONS: {
  value: FirewoodRole;
  label: string;
  hint: string;
}[] = [
  { value: "primary", label: "Primary heat", hint: "Wood is the main source" },
  {
    value: "secondary",
    label: "Secondary",
    hint: "Wood supplements another source",
  },
  {
    value: "occasional",
    label: "Occasional",
    hint: "Rarely used for heat",
  },
];

const PROPANE_PRESETS: { value: PropaneTankPreset; label: string }[] = [
  { value: 100, label: "100 gal" },
  { value: 250, label: "250 gal" },
  { value: 500, label: "500 gal" },
  { value: 1000, label: "1000 gal" },
  { value: "custom", label: "Custom" },
];

const INSULATION_OPTIONS: {
  value: InsulationLevel;
  label: string;
  hint: string;
}[] = [
  { value: "poor", label: "Poor", hint: "Drafty, minimal insulation" },
  { value: "average", label: "Average", hint: "Standard older construction" },
  { value: "good", label: "Good", hint: "Well-insulated walls & attic" },
  { value: "excellent", label: "Excellent", hint: "Modern tight construction" },
];

const PRIORITY_OPTIONS: {
  value: HeatingPriority;
  label: string;
  hint: string;
}[] = [
  {
    value: "whole_house",
    label: "Whole House",
    hint: "Keep the entire home comfortable",
  },
  {
    value: "living_area",
    label: "Main Living Area",
    hint: "Heat only the central living space",
  },
  {
    value: "survival_heat",
    label: "Survival Heat",
    hint: "Minimum warmth to prevent freezing",
  },
];

export function HeatingFuelForm({ value, onChange }: HeatingFuelFormProps) {
  const update = (patch: Partial<HeatingFuelData>) =>
    onChange({ ...value, ...patch });

  return (
    <div className="space-y-6">
      {/* ── Firewood ── */}
      <div>
        <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
          <span>🪵</span> Firewood
        </p>
        <div className="space-y-4">
          <div className="flex items-center gap-3 max-w-xs">
            <label
              htmlFor="hf-firewood-cords"
              className="text-sm text-muted-foreground whitespace-nowrap"
            >
              Cords on hand
            </label>
            <input
              id="hf-firewood-cords"
              type="number"
              min={0}
              step={0.5}
              value={value.firewood_cords}
              onChange={(e) =>
                update({
                  firewood_cords: Number.parseFloat(e.target.value) || 0,
                })
              }
              className="w-24 rounded-md border border-input bg-background px-3 py-1.5 text-sm
                text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              data-ocid="detail.fuel.firewood_input"
            />
            <span className="text-sm text-muted-foreground">cords</span>
          </div>

          {/* Firewood role */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Role of firewood in your heating plan
            </p>
            <div className="space-y-2 max-w-sm">
              {FIREWOOD_ROLE_OPTIONS.map(({ value: v, label, hint }) => (
                <label
                  key={v}
                  className={cn(
                    "flex items-start gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors",
                    (value.firewood_role ?? "primary") === v
                      ? "bg-primary/10 border-primary/30"
                      : "bg-background border-border hover:bg-accent/20",
                  )}
                >
                  <input
                    type="radio"
                    name="hf-firewood-role"
                    value={v}
                    checked={(value.firewood_role ?? "primary") === v}
                    onChange={() => update({ firewood_role: v })}
                    className="mt-0.5 accent-primary"
                    data-ocid={`detail.fuel.firewood_role_${v}`}
                  />
                  <div>
                    <span className="text-sm font-medium text-foreground block">
                      {label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {hint}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Wood share slider — shown when secondary */}
          {(value.firewood_role ?? "primary") === "secondary" && (
            <div className="space-y-2 max-w-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Wood heating share
                </span>
                <span className="text-sm font-semibold text-foreground tabular-nums">
                  {Math.round((value.wood_share ?? 0.4) * 100)}%
                </span>
              </div>
              <Slider
                min={10}
                max={90}
                step={5}
                value={[(value.wood_share ?? 0.4) * 100]}
                onValueChange={([v]) => update({ wood_share: v / 100 })}
                className="max-w-sm"
                data-ocid="detail.fuel.wood_share_slider"
                aria-label="Wood heating share"
              />
              <p className="text-xs text-muted-foreground">
                Percent of your heating load covered by firewood; the rest is
                covered by propane (if enabled below).
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Propane ── */}
      <div>
        <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
          <span>🛢️</span> Propane
        </p>
        <div className="space-y-4">
          {/* Tank size */}
          <div className="flex flex-wrap items-center gap-3">
            <label
              htmlFor="hf-propane-tank-select"
              className="text-sm text-muted-foreground whitespace-nowrap"
            >
              Tank size
            </label>
            <Select
              value={String(value.propane_tank_preset)}
              onValueChange={(v) => {
                const preset =
                  v === "custom"
                    ? "custom"
                    : (Number.parseInt(v) as 100 | 250 | 500 | 1000);
                update({ propane_tank_preset: preset });
              }}
            >
              <SelectTrigger
                id="hf-propane-tank-select"
                className="w-32"
                data-ocid="detail.fuel.propane_tank_select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROPANE_PRESETS.map((p) => (
                  <SelectItem key={String(p.value)} value={String(p.value)}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {value.propane_tank_preset === "custom" && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  step={10}
                  value={value.propane_custom_gallons}
                  onChange={(e) =>
                    update({
                      propane_custom_gallons:
                        Number.parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-24 rounded-md border border-input bg-background px-3 py-1.5 text-sm
                    text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  data-ocid="detail.fuel.propane_custom_input"
                  placeholder="gallons"
                />
                <span className="text-sm text-muted-foreground">gal</span>
              </div>
            )}
          </div>

          {/* Fill level slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="hf-propane-fill-slider"
                className="text-sm text-muted-foreground"
              >
                Current fill level
              </label>
              <span className="text-sm font-semibold text-foreground tabular-nums">
                {value.propane_fill_percent}%
              </span>
            </div>
            <Slider
              id="hf-propane-fill-slider"
              min={0}
              max={100}
              step={5}
              value={[value.propane_fill_percent]}
              onValueChange={([v]) => update({ propane_fill_percent: v })}
              className="max-w-sm"
              data-ocid="detail.fuel.propane_fill_slider"
              aria-label="Propane fill level"
            />
            <div className="flex justify-between text-xs text-muted-foreground max-w-sm">
              <span>0% (empty)</span>
              <span>100% (full)</span>
            </div>
          </div>

          {/* Propane uses */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              What do you use propane for?
            </p>
            <div className="grid grid-cols-2 gap-2 max-w-sm">
              {(
                [
                  {
                    key: "propane_uses_heating" as const,
                    label: "Heating",
                    ocid: "detail.fuel.use_heating",
                  },
                  {
                    key: "propane_uses_cooking" as const,
                    label: "Cooking",
                    ocid: "detail.fuel.use_cooking",
                  },
                  {
                    key: "propane_uses_water_heater" as const,
                    label: "Water Heater",
                    ocid: "detail.fuel.use_water_heater",
                  },
                  {
                    key: "propane_uses_generator" as const,
                    label: "Generator",
                    ocid: "detail.fuel.use_generator",
                  },
                ] as const
              ).map(({ key, label, ocid }) => (
                <label
                  key={key}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm transition-colors",
                    value[key]
                      ? "bg-primary/10 border-primary/30 text-foreground"
                      : "bg-background border-border text-muted-foreground hover:bg-accent/20",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={value[key]}
                    onChange={(e) => update({ [key]: e.target.checked })}
                    className="h-3.5 w-3.5 accent-primary"
                    data-ocid={ocid}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── House context ── */}
      <div>
        <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
          <span>🏠</span> House Context
        </p>
        <div className="space-y-5">
          {/* Heated sqft */}
          <div className="flex items-center gap-3 max-w-xs">
            <label
              htmlFor="hf-heated-sqft"
              className="text-sm text-muted-foreground whitespace-nowrap"
            >
              Heated sq ft
            </label>
            <input
              id="hf-heated-sqft"
              type="number"
              min={200}
              step={100}
              value={value.heated_sqft}
              onChange={(e) =>
                update({
                  heated_sqft: Number.parseInt(e.target.value) || 200,
                })
              }
              className="w-28 rounded-md border border-input bg-background px-3 py-1.5 text-sm
                text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              data-ocid="detail.fuel.heated_sqft_input"
            />
            <span className="text-sm text-muted-foreground">sq ft</span>
          </div>

          {/* Insulation level */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Insulation level
            </p>
            <div className="flex flex-wrap gap-2">
              {INSULATION_OPTIONS.map(({ value: v, label, hint }) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => update({ insulation_level: v })}
                  title={hint}
                  className={cn(
                    "px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors",
                    value.insulation_level === v
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border text-muted-foreground hover:bg-accent/20",
                  )}
                  data-ocid={`detail.fuel.insulation_${v}`}
                  aria-pressed={value.insulation_level === v}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              {
                INSULATION_OPTIONS.find(
                  (o) => o.value === value.insulation_level,
                )?.hint
              }
            </p>
          </div>

          {/* Heating priority */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Heating priority during outage
            </p>
            <div className="space-y-2 max-w-sm">
              {PRIORITY_OPTIONS.map(({ value: v, label, hint }) => (
                <label
                  key={v}
                  className={cn(
                    "flex items-start gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors",
                    value.heating_priority === v
                      ? "bg-primary/10 border-primary/30"
                      : "bg-background border-border hover:bg-accent/20",
                  )}
                >
                  <input
                    type="radio"
                    name="hf-heating-priority"
                    value={v}
                    checked={value.heating_priority === v}
                    onChange={() => update({ heating_priority: v })}
                    className="mt-0.5 accent-primary"
                    data-ocid={`detail.fuel.priority_${v === "whole_house" ? "whole_house" : v === "living_area" ? "living_area" : "survival"}`}
                  />
                  <div>
                    <span className="text-sm font-medium text-foreground block">
                      {label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {hint}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Winter Conditions ── */}
      <div>
        <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
          <span>❄️</span> Winter Conditions
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label
              htmlFor="hf-temp-band"
              className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
            >
              Temperature band
            </label>
            <Select
              value={value.winterTempBand ?? "cool"}
              onValueChange={(v) =>
                update({ winterTempBand: v as WinterTempBand })
              }
            >
              <SelectTrigger
                id="hf-temp-band"
                data-ocid="detail.fuel.temp_band.select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WINTER_TEMP_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="hf-snow"
              className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
            >
              Snow / road disruption
            </label>
            <Select
              value={value.snowDisruption ?? "occasional"}
              onValueChange={(v) =>
                update({ snowDisruption: v as SnowDisruption })
              }
            >
              <SelectTrigger
                id="hf-snow"
                data-ocid="detail.fuel.snow_disruption.select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SNOW_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* ── Heating Coverage Advisory ── */}
      <HeatingCoverageCard fuel={value} />
    </div>
  );
}

// ── Heating Coverage Advisory Card ────────────────────────────────────────────

const TEMP_FACTOR: Record<WinterTempBand, number> = {
  mild: 0.8,
  cool: 1.0,
  cold: 1.2,
  very_cold: 1.4,
};

const INSULATION_FACTOR: Record<InsulationLevel, number> = {
  poor: 1.35,
  average: 1.0,
  good: 0.8,
  excellent: 0.65,
};

const PRIORITY_FACTOR: Record<HeatingPriority, number> = {
  whole_house: 1.0,
  living_area: 0.6,
  survival_heat: 0.35,
};

const ROLE_MULTIPLIER: Record<FirewoodRole, number> = {
  primary: 1.0,
  secondary: 0.5,
  occasional: 0.2,
};

function computeHeatingCoverage(fuel: HeatingFuelData) {
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

  // Use 30 days as planning horizon for "other" drain
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

function computeBestImprovement(fuel: HeatingFuelData): {
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

function HeatingCoverageCard({ fuel }: { fuel: HeatingFuelData }) {
  const { woodDays, propaneHeatDays, totalDays, limiter } =
    computeHeatingCoverage(fuel);
  const best = computeBestImprovement(fuel);

  const totalRounded = Math.round(totalDays);
  const woodRounded = Math.round(woodDays);
  const propaneRounded = Math.round(propaneHeatDays);

  const limiterColor =
    limiter === "Firewood"
      ? "text-amber-600 dark:text-amber-400"
      : limiter === "Propane"
        ? "text-blue-600 dark:text-blue-400"
        : "text-orange-600 dark:text-orange-400";

  const totalColor =
    totalRounded >= 30
      ? "text-emerald-600 dark:text-emerald-400"
      : totalRounded >= 14
        ? "text-amber-600 dark:text-amber-400"
        : "text-red-600 dark:text-red-400";

  return (
    <div
      className="rounded-xl border border-border bg-accent/10 p-4 space-y-4"
      data-ocid="detail.heating_coverage_card"
    >
      <div className="flex items-center gap-2">
        <span className="text-base">🌡️</span>
        <p className="text-sm font-semibold text-foreground">
          Heating Coverage (estimated)
        </p>
      </div>

      {/* Total days */}
      <div className="flex items-end gap-2">
        <span
          className={cn(
            "font-display text-4xl font-bold tabular-nums leading-none",
            totalColor,
          )}
        >
          {totalRounded}
        </span>
        <span className="text-sm text-muted-foreground mb-1">
          heat days available
        </span>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-background rounded-lg border border-border px-3 py-2">
          <p className="text-xs text-muted-foreground mb-0.5">🪵 Firewood</p>
          <p className="text-lg font-bold tabular-nums text-foreground">
            {woodRounded}{" "}
            <span className="text-xs font-normal text-muted-foreground">
              days
            </span>
          </p>
        </div>
        <div className="bg-background rounded-lg border border-border px-3 py-2">
          <p className="text-xs text-muted-foreground mb-0.5">🛢️ Propane</p>
          <p className="text-lg font-bold tabular-nums text-foreground">
            {propaneRounded}{" "}
            <span className="text-xs font-normal text-muted-foreground">
              days
            </span>
          </p>
        </div>
      </div>

      {/* Primary limiter */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Primary limiter:</span>
        <span className={cn("text-xs font-semibold", limiterColor)}>
          {limiter}
        </span>
      </div>

      {/* Best improvement */}
      {best.addedDays > 0.5 && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/8 border border-primary/20">
          <span className="text-base shrink-0">💡</span>
          <div>
            <p className="text-xs font-semibold text-foreground">
              Biggest improvement
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {best.label} →{" "}
              <span className="font-semibold text-primary">
                +{Math.round(best.addedDays)} days
              </span>
            </p>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground/70 italic">
        Estimates vary by stove efficiency, wind, and thermostat habits.
      </p>
    </div>
  );
}

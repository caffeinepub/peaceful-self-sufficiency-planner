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
import { useState } from "react";
import type {
  BuffersPillar,
  ComfortPillar,
  EnergyPillar,
  FoodPillar,
  LandWaterPillar,
  OtherGame,
  WaterPillar,
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
              onChange({ ...value, solar_kw: 0 });
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

      <div className="space-y-3 col-span-full">
        <Label>Tools Completeness: {value.tools_completeness}%</Label>
        <Slider
          min={0}
          max={100}
          step={5}
          value={[value.tools_completeness]}
          onValueChange={([v]) => set("tools_completeness", v)}
        />
        <p className="text-xs text-muted-foreground">
          How complete is your tool collection for self-sufficient living?
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

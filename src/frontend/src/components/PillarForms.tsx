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
import type {
  BuffersPillar,
  ComfortPillar,
  EnergyPillar,
  FoodPillar,
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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <Label htmlFor="solar-kw">Solar Capacity (kW)</Label>
        <Input
          id="solar-kw"
          type="number"
          min={0}
          max={100}
          step={0.5}
          value={value.solar_kw}
          onChange={(e) => set("solar_kw", Number(e.target.value))}
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

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import {
  Copy,
  Download,
  Edit2,
  MapPin,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { ScoreStatusBadge } from "../components/ScoreBadge";
import { MiniScoreRing } from "../components/ScoreRing";
import { useLocations } from "../hooks/useLocations";
import { computeOverallScore } from "../scoring";
import { SEED_LOCATIONS } from "../seedData";
import type { LocationProfile } from "../types";

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

const DEFAULT_PROFILE: Omit<
  LocationProfile,
  "id" | "name" | "state" | "notes" | "created_at" | "updated_at"
> = {
  energy: {
    solar_kw: 0,
    battery_kwh: 0,
    generator: false,
    winter_sun_hours: 3,
    daily_kwh_use: 5,
  },
  water: {
    primary_source: "well",
    storage_gallons: 0,
    gravity_option: false,
    filtration_level: "basic",
  },
  food: {
    garden_sqft: 0,
    chickens_count: 0,
    goats_count: 0,
    root_cellar: false,
    stored_food_months: 0,
  },
  comfort: {
    heat_type: "electric",
    cooking_type: "electric",
    backup_heat: false,
    backup_cooking: false,
  },
  buffers: {
    fuel_reserve_days: 0,
    feed_reserve_days: 0,
    spare_parts_kit: "none",
    tools_completeness: 0,
    resupply_trips_per_month: 4,
  },
  land_water: {
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
  },
};

interface AddLocationForm {
  name: string;
  state: string;
  notes: string;
}

export function LocationsPage() {
  const navigate = useNavigate();
  const {
    locations,
    addLocation,
    deleteLocation,
    duplicateLocation,
    exportAll,
    importLocations,
  } = useLocations();
  const [search, setSearch] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [form, setForm] = useState<AddLocationForm>({
    name: "",
    state: "",
    notes: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = locations.filter((loc) => {
    const q = search.toLowerCase();
    return (
      loc.name.toLowerCase().includes(q) || loc.state.toLowerCase().includes(q)
    );
  });

  const handleAdd = useCallback(() => {
    if (!form.name.trim()) {
      toast.error("Location name is required");
      return;
    }
    const newLoc = addLocation({
      ...DEFAULT_PROFILE,
      name: form.name.trim(),
      state: form.state.trim(),
      notes: form.notes.trim(),
    });
    setAddDialogOpen(false);
    setForm({ name: "", state: "", notes: "" });
    toast.success(`"${newLoc.name}" created`);
    navigate({ to: "/location/$id", params: { id: newLoc.id } });
  }, [form, addLocation, navigate]);

  const handleImport = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(
            ev.target?.result as string,
          ) as LocationProfile[];
          if (!Array.isArray(data)) throw new Error("Invalid format");
          importLocations(data, "merge");
          toast.success(`Imported ${data.length} location(s)`);
        } catch {
          toast.error("Failed to import — invalid JSON format");
        }
        e.target.value = "";
      };
      reader.readAsText(file);
    },
    [importLocations],
  );

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-foreground">
            My Locations
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {locations.length} homestead{locations.length !== 1 ? "s" : ""} in
            your planner
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={exportAll}
            data-ocid="locations.export_button"
            className="gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            data-ocid="locations.import_button"
            className="gap-1.5"
          >
            <Upload className="h-3.5 w-3.5" />
            Import
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
            aria-label="Import locations JSON"
          />
          <Button
            size="sm"
            onClick={() => setAddDialogOpen(true)}
            data-ocid="locations.add_button"
            className="gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Location
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or state…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          data-ocid="locations.search_input"
        />
      </div>

      {/* Locations grid */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        data-ocid="locations.list"
      >
        {filtered.length === 0 ? (
          <div
            className="col-span-2 flex flex-col items-center justify-center py-16 text-center"
            data-ocid="locations.empty_state"
          >
            <span className="text-4xl mb-3">🌿</span>
            <h3 className="font-display text-lg font-medium text-foreground">
              {search ? "No locations match your search" : "No locations yet"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              {search
                ? "Try a different search term or clear the filter."
                : "Add your first homestead location to start planning."}
            </p>
            {!search && (
              <Button
                className="mt-4"
                onClick={() => setAddDialogOpen(true)}
                data-ocid="locations.add_button"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add Location
              </Button>
            )}
          </div>
        ) : (
          filtered.map((loc, idx) => {
            const score = computeOverallScore(loc);
            const ocidIdx = idx + 1;
            return (
              <div
                key={loc.id}
                className={cn(
                  "group relative bg-card border border-border rounded-xl p-5 card-hover",
                  "shadow-xs",
                )}
                data-ocid={`locations.item.${ocidIdx}`}
              >
                {/* Card header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-display font-semibold text-foreground text-base truncate">
                        {loc.name}
                      </h2>
                      {loc.state && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium shrink-0">
                          <MapPin className="h-3 w-3" />
                          {loc.state}
                        </span>
                      )}
                    </div>
                    {loc.notes && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {loc.notes}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground/70 mt-2">
                      Updated {formatDate(loc.updated_at)}
                    </p>
                  </div>
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <MiniScoreRing score={score} size={52} />
                    <ScoreStatusBadge score={score} />
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1.5 mt-4 pt-4 border-t border-border">
                  <Button
                    size="sm"
                    variant="default"
                    className="flex-1 text-xs gap-1"
                    onClick={() =>
                      navigate({ to: "/location/$id", params: { id: loc.id } })
                    }
                    data-ocid={`locations.edit_button.${ocidIdx}`}
                  >
                    <Edit2 className="h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs gap-1"
                    onClick={() => {
                      duplicateLocation(loc.id);
                      toast.success("Location duplicated");
                    }}
                    data-ocid={`locations.duplicate_button.${ocidIdx}`}
                  >
                    <Copy className="h-3 w-3" />
                    Copy
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                        data-ocid={`locations.delete_button.${ocidIdx}`}
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Delete "{loc.name}"?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently remove this location and all its
                          data. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel data-ocid="locations.cancel_button">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            deleteLocation(loc.id);
                            toast.success(`"${loc.name}" deleted`);
                          }}
                          className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                          data-ocid="locations.confirm_button"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Location Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">New Location</DialogTitle>
            <DialogDescription>
              Add a homestead location to start tracking your self-sufficiency
              profile.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="new-name">Location name *</Label>
              <Input
                id="new-name"
                placeholder="e.g. Murphy NC – creek"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                data-ocid="locations.input"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-state">State / Region</Label>
              <Input
                id="new-state"
                placeholder="e.g. NC"
                value={form.state}
                onChange={(e) =>
                  setForm((f) => ({ ...f, state: e.target.value }))
                }
                data-ocid="locations.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-notes">Notes</Label>
              <Textarea
                id="new-notes"
                placeholder="Brief description of this property…"
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                rows={3}
                data-ocid="locations.textarea"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddDialogOpen(false);
                setForm({ name: "", state: "", notes: "" });
              }}
              data-ocid="locations.cancel_button"
            >
              Cancel
            </Button>
            <Button onClick={handleAdd} data-ocid="locations.submit_button">
              Create &amp; Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Seed data hint */}
      {locations.length > 0 &&
        locations.every((l) => SEED_LOCATIONS.some((s) => s.id === l.id)) && (
          <p className="text-xs text-center text-muted-foreground/60">
            These are example locations — feel free to edit them or add your
            own.
          </p>
        )}
    </div>
  );
}

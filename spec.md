# Peaceful Self-Sufficiency Planner

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- Full single-page React + TypeScript + Tailwind CSS app
- All data persisted in localStorage only (no backend, no auth, no external APIs)
- 4 main screens: Locations List, Location Detail, Compare View, Quiet Week Mode
- About/Info panel accessible from nav
- Dark/light theme toggle persisted in localStorage
- "Peaceful Self-Sufficiency Score" (0–100) per location using 5 weighted pillars
- Animated score ring, SVG radar chart, bar chart comparisons (using Recharts if available, else SVG)
- "Explain My Score" expandable panel with human-readable breakdown
- "Next Best Upgrade" advisor card computing the single highest-gain input change
- Quiet Week Mode: scenario simulation with calm Comfort Level output
- Export all / Import JSON for local backup from Locations List
- Seed data: 2 pre-loaded example Murphy NC locations

### Modify
- N/A (new project)

### Remove
- N/A (new project)

## Implementation Plan

### Data Model (localStorage)
- `locations` key stores an array of LocationProfile objects
- Each LocationProfile: id, name, state, notes, created_at, updated_at + 5 pillar objects
- Pillar 1 (Energy): solar_kw, battery_kwh, generator, winter_sun_hours, daily_kwh_use
- Pillar 2 (Water): primary_source, storage_gallons, gravity_option, filtration_level
- Pillar 3 (Food): garden_sqft, chickens_count, goats_count, root_cellar, stored_food_months
- Pillar 4 (Comfort): heat_type, cooking_type, backup_heat, backup_cooking
- Pillar 5 (Buffers): fuel_reserve_days, feed_reserve_days, spare_parts_kit, tools_completeness, resupply_trips_per_month
- `theme` key: 'light' | 'dark'

### Scoring Engine (pure functions, no side effects)
- computeEnergyScore(energy): coverage_ratio formula → clamp 0–100
- computeWaterScore(water): stored_days + bonuses → clamp 0–100
- computeFoodScore(food): stored_bonus + protein_bonus + cellar + garden → clamp 0–100
- computeComfortScore(comfort): heat + cooking scores + backups → clamp 0–100
- computeBuffersScore(buffers): fuel + feed + spare_parts + tools - trips_penalty → clamp 0–100
- computeOverallScore(pillars): weighted average (20/20/25/20/15)

### Screens & Components

1. **App shell**: top nav with logo, nav links (Locations, Compare, Quiet Week, About), theme toggle
2. **Locations List** (`/`):
   - Search bar, "Add Location" button
   - Grid of location cards showing name, state, score ring, last updated, action buttons (edit, duplicate, delete)
   - Export all / Import JSON buttons
3. **Location Detail** (`/location/:id`):
   - Animated score ring (CSS/SVG animation)
   - SVG or Recharts radar chart of 5 pillar scores
   - 5 pillar input cards with all fields, sliders, selects, checkboxes
   - "Explain My Score" accordion with per-pillar breakdown text
   - "Next Best Upgrade" card with top suggestion + estimated gain
4. **Compare View** (`/compare`):
   - Multi-select up to 4 locations
   - Bar chart of overall scores
   - Pillar comparison table (rows = pillars, columns = locations) with color highlighting (best = green, worst = red)
   - Key input diffs panel
5. **Quiet Week Mode** (`/quiet-week`):
   - Location picker + scenario selector (3-day, 7-day, 14-day)
   - Compute calm days for food, water, energy, fuel
   - Display Comfort Level: High / Medium / Low with calm, practical language
6. **About Panel** (modal or route `/about`):
   - App description, scoring summary, privacy note, export/import instructions

### Upgrade Advisor Logic
- Defined upgrade set: +3 stored_food_months, +5 battery_kwh, add gravity_option, add root_cellar, reduce resupply_trips by 2, add backup_heat, add backup_cooking, +1 solar_kw
- For each upgrade, compute new overall score; find the one with max gain
- Display: upgrade label + "+X points" estimated gain

### Seed Data
- Pre-load on first run (check if `locations` key is absent in localStorage)
- Murphy NC - creek and Murphy NC - ridge as specified

# Peaceful Self-Sufficiency Planner

## Current State

The Location detail page has a section flow ending with:
- Land Resources group containing "Land & Water Ecology" (LandWaterForm)
- Followed by Winter Planning and Score Transparency

The `LocationProfile` type includes `land_water: LandWaterPillar` with fields for surface water, irrigation access, woods_percent, deer_sign, other_game, fish_present, ducks_geese_present, well data, etc.

The `FoodPillar` includes `garden_sqft`.

No Land Productivity section exists yet.

## Requested Changes (Diff)

### Add
- New `LandProductivityData` interface in `types.ts` with fields:
  - `fruit_trees: "none" | "1-5" | "6-15" | "15+"`
  - `wooded_acres: number`
  - `pasture_acres: number`
- Add `land_productivity?: LandProductivityData` to `LocationProfile`
- Default values in `useLocations.ts` migration
- New `LandProductivitySection` component (or inline in PillarForms.tsx) with 6 subsections:
  1. **Garden Production** -- reads `food.garden_sqft`, computes `peopleSupported = garden_sqft / 200`, displays estimated seasonal vegetable support
  2. **Orchard / Fruit Trees** -- select: None / 1–5 / 6–15 / 15+; display estimated annual fruit production ranges per tier
  3. **Woodland Resources** -- number input for wooded acres; display sustainable firewood harvest: `low = acres * 0.5`, `high = acres * 1.0` cords/year
  4. **Wildlife Protein Potential** -- derives Low/Moderate/High from existing `land_water` fields (deer_sign, fish_present, ducks_geese_present, other_game)
  5. **Grazing Potential** -- number input for pasture acres; display goat capacity (acres / 1.5 rounded) and cow capacity (acres / 2.5 rounded)
  6. **Irrigation Advantage** -- reads `land_water.has_surface_water` and `land_water.access_for_irrigation`; if both are favorable, show advisory message about strong irrigation potential
- **Land Productivity Overview** summary card at bottom of section showing all 6 estimates in a clean table/list
- All advisory only -- does NOT affect Peaceful Score

### Modify
- `LocationDetailPage.tsx`: insert the new Land Productivity section card right after the Land & Water Ecology card, within the Land Resources group
- `useLocations.ts`: add migration default for `land_productivity`
- `types.ts`: add `LandProductivityData` type and field on `LocationProfile`

### Remove
- Nothing removed

## Implementation Plan

1. Add `LandProductivityData` type and `land_productivity` field to `types.ts`
2. Add default and migration in `useLocations.ts`
3. Create `LandProductivityForm` component in `PillarForms.tsx` with all 6 subsections and the overview summary
4. Wire the component into `LocationDetailPage.tsx` after the Land & Water Ecology card, passing `location.food.garden_sqft`, `location.land_water`, and `location.land_productivity` + onChange
5. Validate and build

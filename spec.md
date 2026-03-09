# Peaceful Self-Sufficiency Planner

## Current State

The LocationDetailPage renders sections in a mixed order that causes cognitive jumps between system types and planning layers. Sections currently appear in roughly this order: Overview, Next Best Upgrades, Energy, Comfort/Heat sources, Food, Buffers, Water, Land & Water, Heating Fuel & House Context, Winter Conditions, Heating Coverage, Score Explanation. There are no visual group dividers between logical sections.

## Requested Changes (Diff)

### Add
- Visual section group dividers with labels: "Core Systems", "Food Systems", "Home Independence", "Land Resources", "Winter Planning"
- A visual progress bar for Heat Coverage inside the Heating Coverage card (e.g. ████████░░░ 17 days)
- Section header icons already exist — make group headers more prominent

### Modify
- Reorder all sections on LocationDetailPage to this exact sequence:
  1. Property Overview (name, state, notes, score ring, pillar balance, target progress)
  2. Next Best Upgrades
  3. [Group: Core Systems]
     - Energy System (solar, battery, daily usage, generator, winter sun hours)
     - Water Security (primary source, filtration, storage, gravity-fed)
  4. [Group: Food Systems]
     - Food Continuity (garden area, chickens, goats, stored food, root cellar)
  5. [Group: Home Independence]
     - Home Comfort Independence (heat source, cooking source, backup heat, backup cooking)
  6. [Group: Resilience Buffers]
     - Buffers & Rhythm (fuel reserve, animal feed reserve, spare parts, resupply trips)
  7. [Group: Land Resources]
     - Land & Water Ecology (surface water, land & habitat, well water)
  8. [Group: Winter Planning]
     - Heating Fuel & House Context (firewood, wood storage status, woodshed estimator, firewood role, propane)
     - House Context (heated sqft, insulation, heating priority)
     - Winter Conditions (temperature band, snow disruption)
     - Heating Coverage card with visual bar
  9. Score Explanation ("Explain My Score" — moved below Winter Planning)

### Remove
- Nothing removed; only reordering and adding group dividers and bar to heating coverage

## Implementation Plan

1. Read current LocationDetailPage.tsx section structure and identify component render order
2. Reorder JSX blocks in LocationDetailPage.tsx to match the new sequence
3. Add styled group divider components (a horizontal rule with a label) between each logical group
4. Add a visual bar to the Heating Coverage card (using a div with background fill, same pattern as other gauge bars in the app)
5. Ensure Score Explanation section is rendered last (after Winter Planning)
6. Validate and deploy

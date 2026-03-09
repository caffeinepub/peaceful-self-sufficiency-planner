# Peaceful Self-Sufficiency Planner

## Current State

- HeatingFuelForm in PillarForms.tsx includes a HeatingCoverageCard with computeHeatingCoverage logic already implemented
- Card icon is 🌡️ and propane logic uses a 30-day planning horizon for non-heating drain
- Winter Mode (WinterLockdownPage) is an existing route
- Nav has: Locations, Compare, Quiet Week, Winter Mode, About
- No Resilience Timeline page exists

## Requested Changes (Diff)

### Add
- Export `computeHeatingCoverage` as a shared utility (heatingCalc.ts) used by both PillarForms and the new timeline page
- New ResilienceTimelinePage at route `/resilience-timeline`
  - Location selector + people stepper
  - Computes: heatDays, batteryDays, waterDays, foodDays, feedDays
  - Visual horizontal bars for each resource
  - Limiting factor + Comfort horizon insights
  - Advisory note: "These estimates are advisory and depend on weather, stove efficiency, and usage habits."
- Nav link "Resilience Timeline" after Winter Mode

### Modify
- HeatingCoverageCard icon: 🌡️ → 🔥
- HeatingCoverageCard title: update to match spec ("🔥 Heating Coverage (Estimated)")
- PillarForms imports computeHeatingCoverage from shared heatingCalc.ts

### Remove
- Nothing removed

## Implementation Plan

1. Create `src/frontend/src/heatingCalc.ts` — export computeHeatingCoverage and computeBestImprovement (moved from PillarForms)
2. Update PillarForms.tsx — remove inline compute functions, import from heatingCalc.ts, update card icon to 🔥
3. Create `src/frontend/src/pages/ResilienceTimelinePage.tsx` — full page with resource bars, insights
4. Update App.tsx — add route `/resilience-timeline`
5. Update Layout.tsx — add nav link for Resilience Timeline

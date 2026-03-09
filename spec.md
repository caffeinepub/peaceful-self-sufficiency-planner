# Peaceful Self-Sufficiency Planner

## Current State
The app has a Resilience Timeline page that computes resource coverage days (heat, electricity, water, food, animal feed) for a selected location using existing `computeHeatingCoverage` and pillar data. Navigation includes Quiet Week, Winter Mode, Timeline, Compare, and About pages.

## Requested Changes (Diff)

### Add
- New `ScenarioSimulatorPage.tsx` page at route `/scenario-simulator`
- Four predefined scenarios: Quiet Week (7 days), Grid Power Failure, Winter Storm Isolation, Dry Summer / Drought
- Each scenario applies modifier logic on top of existing resource calculations to reflect scenario-specific conditions
- Per-scenario display of: heating coverage, water availability, food reserves, electricity coverage, animal feed reserves (all in days)
- Limiting factor identification for each scenario (the shortest-duration resource)
- A nav entry "Scenarios" in Layout.tsx using a relevant Lucide icon
- Route registered in App.tsx

### Modify
- `App.tsx`: add import and route for ScenarioSimulatorPage
- `Layout.tsx`: add "Scenarios" nav link pointing to `/scenario-simulator`

### Remove
- Nothing

## Implementation Plan

1. Write `ScenarioSimulatorPage.tsx` with:
   - Location selector (reuse pattern from ResilienceTimelinePage)
   - People count stepper
   - Four scenario cards, each expanding to show resource results and limiting factor
   - Scenario modifier logic:
     - **Quiet Week (7 days)**: Baseline; all normal calculations; note this is a 7-day window so compare against 7 days
     - **Grid Power Failure**: Electricity = battery_kwh / daily_kwh_use only (no recharge); other resources normal
     - **Winter Storm Isolation**: Force heating demand factor to use "cold" temp band minimum; electricity reduced (winter sun hours cut to 1); other resources normal
     - **Dry Summer / Drought**: Water reduced if primary_source is "rain" (50% reduction); heat days = unlimited (not relevant); electricity slightly increased (more sun); feed stressed if pasture acres present
   - Shared `computeScenarioResources()` helper that takes a location + scenario modifiers
   - Resource display: days value, color-coded bar, limiting factor callout
   - Advisory disclaimer at bottom

2. Update `App.tsx` to register `/scenario-simulator` route
3. Update `Layout.tsx` NAV_LINKS to include Scenarios entry

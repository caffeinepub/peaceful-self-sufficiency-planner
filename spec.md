# Peaceful Self-Sufficiency Planner

## Current State

- 6-pillar scoring system: Energy, Water, Food, Comfort, Buffers, Land & Water Ecology
- Overall weights: Energy 18%, Water 18%, Food 22%, Comfort 17%, Buffers 13%, Land & Water 12%
- Quiet Week Mode: location + scenario selector (3–360 days) + people stepper + 4 resource cards + comfort level summary
- Food scoring: stored months up to 55 pts, protein bonus up to 30, cellar 10, garden 15

## Requested Changes (Diff)

### Add

- **Winter Lockdown Mode** — new simulation page (route `/winter-lockdown`) accessible from nav alongside Quiet Week
  - Fixed scenario: 14-day no road access, 5 low-solar days, freezing temps
  - Controls: location selector + people stepper (same as Quiet Week)
  - Winter-adjusted scoring engine (separate from standard scoring):
    - Solar output reduced 40%
    - Energy usage increased 15%
    - Battery autonomy weighted heavily: up to 60 pts (days_of_battery / 14 days * 60, clamped)
    - Wood heat: +20 bonus; electric-only heat: -15 penalty
    - Gravity-fed water: +15 bonus; no gravity (pump only): -15 penalty
    - Fuel reserve importance doubled (compare to 28 days instead of 14)
    - Food stored months weighted up to 70 pts (stored_months / 6 * 70, clamped)
  - **Winter Score** (0–100) computed from above
  - **Winter Label**: "Calm Through Winter" (≥70), "Manageable" (≥45), "Strained" (<45)
  - **Estimated Calm Days**: min(food_days, fuel_days, water_days, energy_days) under winter assumptions, scaled per people
  - Output section: winter score ring + label + estimated calm days + per-resource breakdown cards (showing winter-adjusted values)
- **Nav link** for Winter Lockdown Mode (snowflake icon or similar) in Layout

### Modify

- **Overall weights** in `scoring.ts` (both `computeOverallScore` and `computeAllScores`):
  - Energy: 16%
  - Water: 16%
  - Food: 30%
  - Comfort: 16%
  - Buffers: 12%
  - Land & Water: 10%

- **Food scoring** in `scoring.ts` (`computeFoodScore`):
  - `stored_food_months` now up to 60 pts: `(Math.min(stored_food_months, 12) / 12) * 60`
  - Protein bonus: chickens up to 15, goats up to 15 (unchanged)
  - Root cellar bonus: +10 (unchanged)
  - Garden bonus: reduce to 10 pts max (to keep total clamp-friendly): `(Math.min(garden_sqft, 2000) / 2000) * 10`
  - Total still clamped 0–100

### Remove

- Nothing removed

## Implementation Plan

1. **scoring.ts**: Update `computeOverallScore` and `computeAllScores` weights (Energy 0.16, Water 0.16, Food 0.30, Comfort 0.16, Buffers 0.12, Land & Water 0.10)
2. **scoring.ts**: Update `computeFoodScore` — stored months max 60 pts, garden reduced to 10 pts
3. **scoring.ts**: Add `computeWinterScore(loc, people)` function that:
   - Applies winter adjustments to energy/water/food/buffers
   - Returns `{ winterScore, winterLabel, calmDays, resources }` where resources are winter-adjusted day estimates for food, water, energy, fuel
4. **App.tsx**: Add `/winter-lockdown` route pointing to new `WinterLockdownPage`
5. **Layout.tsx**: Add nav link for Winter Lockdown Mode with a snowflake or winter icon
6. **WinterLockdownPage.tsx**: New page at `src/pages/WinterLockdownPage.tsx`
   - Location selector + people stepper
   - Assumption chips (14-day no road, 5 low-solar, freezing, 15% caloric demand, no fuel delivery)
   - Winter Score ring + label badge
   - Estimated Calm Days callout
   - 4 resource cards (food, water, energy, fuel) with winter-adjusted values
   - Data-ocid markers throughout

# Peaceful Self-Sufficiency Planner

## Current State
Under Heating Fuel & House Context, there is a "Maximum storage capacity (cords)" input field. Below it, when a value is set, a WoodStorageCard advisory component renders, which includes an "Estimated Woodshed Size" sub-section that automatically calculates and displays physical woodshed dimensions (standard and compact layouts) based on the storage capacity.

## Requested Changes (Diff)

### Add
- An optional collapsible section below the "Maximum storage capacity" field labeled "Estimate from woodshed dimensions"
- When expanded, shows three dimension inputs: Length (ft), Depth (ft), Stack height (ft)
- Two optional adjustment selectors: Walkway space (none / small / moderate) and Stack style (neat stacked / loose stacked)
- Live calculation display: `totalVolume = length × depth × stackHeight`, then `usableVolume = totalVolume × walkwayFactor × stackStyleFactor`, then `estimatedCapacityCords = usableVolume / 128`
  - Walkway: none=1.0, small=0.9, moderate=0.8
  - Stack style: neat stacked=1.0, loose stacked=0.9
- Shows result: "Estimated storage capacity: X.X cords"
- "Use this estimate" button that, when clicked, fills the Maximum storage capacity field with the estimated value
- State for this estimator is local (not saved to location data)

### Modify
- Remove the "Estimated Woodshed Size" advisory sub-section from WoodStorageCard (the old auto-calculated dimensions box)
- The flow is reversed: dimensions → capacity estimate, instead of capacity → dimensions display

### Remove
- The automatic Estimated Woodshed Size box that was shown inside WoodStorageCard based on storage capacity

## Implementation Plan
1. In PillarForms.tsx, find the max_firewood_storage input block
2. Add local state for: `showDimEstimator` (boolean toggle), `dimLength`, `dimDepth`, `dimStackHeight`, `walkway` (none/small/moderate), `stackStyle` (neat/loose)
3. After the max storage input and helper text, add a toggle button/link: "Estimate from woodshed dimensions" that shows/hides the estimator
4. When open, render dimension inputs and adjustment selectors, live calculate the estimate, display it, and show "Use this estimate" button
5. "Use this estimate" calls update({ max_firewood_storage: estimatedValue }) and optionally collapses the estimator
6. Remove the Estimated Woodshed Size section from WoodStorageCard

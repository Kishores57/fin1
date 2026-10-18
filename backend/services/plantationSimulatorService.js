/**
 * Tree Plantation Planning Simulator Service
 *
 * Rules:
 * 1. Projected Tree Count = Current Registered Trees + Proposed Additional Trees
 * 2. Marked strictly as a hypothetical scenario (does NOT modify actual databases).
 * 3. Recommends species tailored to Nashik regional soil, drought resilience, and campus space.
 * 4. Estimates required planting area (standard 4m x 4m spacing = 16 m² per canopy tree).
 */

const RECOMMENDED_SPECIES = [
  {
    species: 'Neem (Azadirachta indica)',
    type: 'Evergreen Shade & Medicinal',
    suitability: 'High drought resistance, excellent air pollution filter, minimal water demand.',
    spacingMeters: 4.5,
    areaPerTreeSqM: 20,
  },
  {
    species: 'Rain Tree (Samanea saman)',
    type: 'Large Spreading Canopy',
    suitability: 'Massive thermal cooling canopy, rapid growth for heat island mitigation.',
    spacingMeters: 6.0,
    areaPerTreeSqM: 36,
  },
  {
    species: 'Ashoka (Polyalthia longifolia)',
    type: 'Columnar Boundary & Noise Barrier',
    suitability: 'Ideal for boundary fencing, compact root system, aesthetic windbreak.',
    spacingMeters: 2.5,
    areaPerTreeSqM: 6.25,
  },
  {
    species: 'Banyan (Ficus benghalensis)',
    type: 'Keystone Biodiversity Giant',
    suitability: 'Maximum bird and pollinator nesting support; suitable for large central clearings.',
    spacingMeters: 10.0,
    areaPerTreeSqM: 100,
  },
  {
    species: 'Bamboo (Bambusa vulgaris)',
    type: 'Rapid Biomass & Soil Binder',
    suitability: 'Steep slope stabilization, soil erosion control, high oxygen release.',
    spacingMeters: 2.0,
    areaPerTreeSqM: 4.0,
  },
];

export function simulatePlantation({
  currentTreeCount = 0,
  proposedAdditionalTrees = 10,
  availablePlantingAreaSqM = 1000,
  totalAreaSqM = 5000,
}) {
  const count = Math.max(0, parseInt(proposedAdditionalTrees) || 0);
  const projectedCount = currentTreeCount + count;

  // Assume avg required space ~ 16 m² per medium shade sapling
  const avgRequiredSpacePerTree = 16; // m²
  const requiredPlantingSpace = count * avgRequiredSpacePerTree;
  const isSpaceSufficient = availablePlantingAreaSqM >= requiredPlantingSpace;
  const maxCapacityPossible = Math.floor(availablePlantingAreaSqM / avgRequiredSpacePerTree);

  // Projected tree density
  const areaSqKm = totalAreaSqM / 1_000_000;
  const currentDensity = areaSqKm > 0 ? parseFloat((currentTreeCount / areaSqKm).toFixed(1)) : 0;
  const projectedDensity = areaSqKm > 0 ? parseFloat((projectedCount / areaSqKm).toFixed(1)) : 0;

  return {
    scenarioType: 'Hypothetical Simulation (No Database Changes Made)',
    currentTreeCount,
    proposedAdditionalTrees: count,
    projectedTreeCount: projectedCount,
    currentDensityPerKm2: currentDensity,
    projectedDensityPerKm2: projectedDensity,
    availablePlantingAreaSqM: parseFloat(availablePlantingAreaSqM.toFixed(1)),
    requiredPlantingSpaceSqM: parseFloat(requiredPlantingSpace.toFixed(1)),
    isSpaceSufficient,
    maxCapacityPossible,
    recommendedSpecies: RECOMMENDED_SPECIES,
    assumptionsAndUncertainties: [
      'Standard 4m x 4m canopy spacing assumed for sapling pit excavation.',
      'Actual survival rate depends on seasonal watering, pest control, and soil depth.',
      'Hypothetical scenario only — tree records are not committed to SQLite or MongoDB.',
      'Does not claim exact microclimate cooling without post-planting canopy maturation (5-10 years).',
    ],
  };
}

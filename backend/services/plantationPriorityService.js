/**
 * Multi-Criteria Plantation Priority Analysis Service
 *
 * Scientific Objective:
 * Transparently combine geospatial indicators into an explainable Priority Score:
 *   Priority Score P = (w1 * L) + (w2 * V) + (w3 * H) + (w4 * S)
 *
 * Variables (all normalized [0.0 - 1.0], higher = higher plantation urgency/feasibility):
 * 1. L (Low-Tree-Cover Indicator):
 *    - Higher score when existing tree density is low.
 *    - If tree density >= 1000 trees/km², L -> 0.0. If 0 trees/km², L -> 1.0.
 * 2. V (Low-Vegetation Indicator from Sentinel-2 NDVI):
 *    - Derived from mean NDVI: V = clamp(1 - (meanNDVI / 0.60), 0, 1).
 *    - Sparse vegetation yields high score; lush canopy yields low score.
 * 3. H (Urban Heat Island / LST Priority Indicator):
 *    - Derived from Landsat LST (°C): H = clamp((LST - 30) / (44 - 30), 0, 1).
 *    - Hotter surface areas (heat traps) get higher cooling priority.
 * 4. S (Land Suitability Indicator from LULC):
 *    - Ratio of open pervious plantable soil vs impervious built concrete.
 *    - S = (openPerviousArea / totalArea). High pervious ground = high feasibility.
 *
 * Configurable Weights (Default Sum = 1.0):
 * - w1 (Tree Density Deficit) = 0.25
 * - w2 (Low Vegetation Canopy) = 0.25
 * - w3 (Surface Heat Vulnerability) = 0.25
 * - w4 (Pervious Land Feasibility) = 0.25
 */

export const PRIORITY_METADATA = {
  formula: 'P = (w1 * L) + (w2 * V) + (w3 * H) + (w4 * S)',
  defaultWeights: {
    w1_treeDeficit: 0.25,
    w2_lowVegetation: 0.25,
    w3_heatPriority: 0.25,
    w4_landSuitability: 0.25,
  },
  classes: {
    HIGH: { label: 'High Plantation Priority', minScore: 0.65, color: '#dc2626' },
    MEDIUM: { label: 'Medium Plantation Priority', minScore: 0.40, color: '#f59e0b' },
    LOW: { label: 'Low Plantation Priority', minScore: 0.0, color: '#10b981' },
  },
  limitations: 'Calculates theoretical spatial priority. Actual planting requires utility line clearance, soil depth verification, and municipal sanction.',
};

export function calculatePlantationPriority({
  treeDensityPerKm2 = 0,
  meanNDVI = 0.25,
  meanLST = 38.0,
  potentialPlantingPercent = 30.0,
  customWeights = {},
}) {
  const w1 = customWeights.w1 !== undefined ? customWeights.w1 : 0.25;
  const w2 = customWeights.w2 !== undefined ? customWeights.w2 : 0.25;
  const w3 = customWeights.w3 !== undefined ? customWeights.w3 : 0.25;
  const w4 = customWeights.w4 !== undefined ? customWeights.w4 : 0.25;

  // 1. L: Low-Tree-Cover (normalized 0 to 1)
  // Benchmark: 1000 trees/km² = adequate urban canopy (L = 0)
  const normTreeDensity = Math.min(1000, Math.max(0, treeDensityPerKm2));
  const L = parseFloat((1 - (normTreeDensity / 1000)).toFixed(3));

  // 2. V: Low-Vegetation Indicator (from NDVI)
  // Benchmark: NDVI >= 0.55 is dense canopy (V = 0), NDVI <= 0.10 is barren (V = 1)
  const normNDVI = Math.min(0.55, Math.max(0.10, meanNDVI));
  const V = parseFloat((1 - ((normNDVI - 0.10) / (0.55 - 0.10))).toFixed(3));

  // 3. H: Thermal Priority Indicator (from Landsat LST)
  // Benchmark: 32°C is cool canopy (H = 0), 44°C is asphalt heat island (H = 1)
  const normLST = Math.min(44, Math.max(32, meanLST));
  const H = parseFloat(((normLST - 32) / (44 - 32)).toFixed(3));

  // 4. S: Land Suitability (from LULC pervious open ground %)
  // Benchmark: 0% open = 0, 80%+ open = 1
  const normSuitability = Math.min(80, Math.max(0, potentialPlantingPercent));
  const S = parseFloat((normSuitability / 80).toFixed(3));

  // Total Priority Score P
  const totalWeight = (w1 + w2 + w3 + w4) || 1.0;
  const rawScore = (w1 * L + w2 * V + w3 * H + w4 * S) / totalWeight;
  const priorityScore = parseFloat(Math.min(1.0, Math.max(0.0, rawScore)).toFixed(3));

  // Priority Classification
  let priorityLevel = 'LOW';
  let label = 'Low Plantation Priority (Adequate Greenery / Low Suitability)';
  let color = '#10b981';

  if (priorityScore >= 0.65) {
    priorityLevel = 'HIGH';
    label = 'High Plantation Priority (Urgent Canopy Need & High Soil Feasibility)';
    color = '#dc2626';
  } else if (priorityScore >= 0.40) {
    priorityLevel = 'MEDIUM';
    label = 'Medium Plantation Priority (Moderate Gap / Selective Infill)';
    color = '#f59e0b';
  }

  // Ecological and Spatial Impact Analysis based on Area Conditions
  let zoneType = 'GREEN_ZONE'; // GREEN_ZONE (Adequate canopy), YELLOW_ZONE (Moderate), RED_ZONE (Heat Island / Barren)
  let zoneBadge = 'Green Zone (Well Vegetated & Protected)';
  let plantationDecision = 'Plantation Not Required — Conserve Existing Canopy';
  let decisionBadgeColor = '#10b981';

  if (meanNDVI < 0.25 || treeDensityPerKm2 < 500 || meanLST > 39.5) {
    zoneType = 'RED_ZONE';
    zoneBadge = 'Red Zone (Critical Heat Island & Low Canopy Cover)';
    plantationDecision = 'Plantation Urgently Required (High Priority Infill)';
    decisionBadgeColor = '#ef4444';
  } else if (meanNDVI < 0.40 || treeDensityPerKm2 < 1200) {
    zoneType = 'YELLOW_ZONE';
    zoneBadge = 'Yellow Zone (Moderate Greenery / Selective Gap)';
    plantationDecision = 'Selective Plantation Recommended (Avenue & Corner Infill)';
    decisionBadgeColor = '#f59e0b';
  }

  // Positive impacts on humans and animals
  const ecologicalImpact = {
    humanHealth: {
      coolingEffect: `Shaded canopy lowers microclimate radiant heat by ${(42.6 - meanLST).toFixed(1)}°C, reducing localized thermal heat-island stress for students and pedestrians.`,
      airQuality: 'Active leaf area traps particulate matter (PM2.5 and PM10), absorbing vehicular exhaust along campus avenues.',
      mentalWellbeing: 'Biophilic greenery and quiet acoustic leaf buffer create a calm, cooler study and walking environment.',
    },
    wildlifeSupport: {
      birdHabitat: 'Mature canopies of Ficus, Rain Tree, and Ashok provide vital nesting branches for Bulbuls, Mynas, and Sunbirds.',
      pollinators: 'Flowering cycles support local bee colonies, butterflies, and urban insect biodiversity.',
      soilMicrobiome: 'Root root systems prevent campus soil erosion, preserve moisture, and enrich beneficial ground organisms.',
    },
  };

  // Realistic negative impacts & construction/structural obstacles
  const negativeImpacts = {
    constructionObstacles: 'Dense root spreads and low-hanging lateral branches can interfere with future campus building expansion, excavation, and road widening.',
    infrastructureHazards: 'Surface root upheaval can crack pedestrian concrete pathways, drainage gutters, and perimeter compound walls.',
    undergroundUtilities: 'Deep taproots and lateral roots risk damaging underground electric cabling, water piping, and sewer conduits.',
    maintenanceOverhead: 'Seasonal leaf litter clogs rooftop rainwater drains, and brittle dry branches pose safety hazards during monsoon high winds.',
  };

  return {
    metadata: PRIORITY_METADATA,
    priorityScore,
    priorityLevel,
    label,
    color,
    zoneType,
    zoneBadge,
    plantationDecision,
    decisionBadgeColor,
    ecologicalImpact,
    negativeImpacts,
    weightsUsed: { w1, w2, w3, w4 },
    factors: {
      lowTreeCover: {
        score: L,
        observedValue: `${treeDensityPerKm2.toFixed(1)} trees/km²`,
        rationale: L > 0.5 ? 'Significant tree canopy deficit relative to urban density target' : 'Existing tree stand density is satisfactory',
      },
      lowVegetation: {
        score: V,
        observedValue: `NDVI ${meanNDVI.toFixed(2)}`,
        rationale: V > 0.5 ? 'Spectral reflectance indicates low green biomass coverage' : 'Substantial green vegetative cover observed',
      },
      heatVulnerability: {
        score: H,
        observedValue: `${meanLST.toFixed(1)}°C LST`,
        rationale: H > 0.5 ? 'High surface temperature indicates severe localized heat island' : 'Microclimate temperature is moderated by surrounding features',
      },
      landSuitability: {
        score: S,
        observedValue: `${potentialPlantingPercent.toFixed(1)}% plantable open space`,
        rationale: S > 0.4 ? 'Substantial pervious soil available for sapling plantation' : 'Limited unpaved open space restricts extensive planting',
      },
    },
  };
}

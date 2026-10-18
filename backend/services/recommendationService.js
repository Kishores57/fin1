/**
 * Location-Specific Plantation Recommendation Engine
 *
 * Requirements:
 * - Transparent scoring system based on real geographic and environmental datasets:
 *   1. Low existing tree density & distance to registered trees (minimum spacing > 6m).
 *   2. Low vegetation / open ground (NDVI 0.15 - 0.35, barren/grass clearings).
 *   3. Suitable land use (OPEN_PERVIOUS soil, lawns, verges; rejects permanent buildings, asphalt roadways).
 *   4. Land suitability & available canopy planting space (root & canopy radius clearance).
 *   5. Distance from buildings, roads, utilities, and restricted areas.
 *   6. Microclimate thermal urgency (cooling high Land Surface Temperature hot spots).
 *   7. Species matching based on local climate, drought tolerance, soil space, and native preferences.
 *
 * Priorities:
 * - Red (#EF4444): High priority for investigation (highest canopy gap, hot surface, plantable space).
 * - Orange (#F59E0B): Moderate priority (moderate gap, selective infill).
 * - Green (#10B981): Potentially suitable plantation location (viable open location with good conditions).
 *
 * Disclaimers:
 * - These colors and scores represent analytical geospatial priority, not confirmed legal planting permission.
 * - Field verification required for underground utilities, drainage, and municipal clearance.
 */

import { distanceMeters, getBoundingBox, isPointInPolygon } from './spatialUtils.js';
import { getLULCClass } from './lulcService.js';

export const RECOMMENDATION_METADATA = {
  methodology: 'Multi-Factor Geospatial Suitability & Spatial Infill Ranking',
  formula: 'FinalScore = (0.25 * S_treeDist) + (0.25 * S_vegDeficit) + (0.20 * S_lulc) + (0.15 * S_thermalCooling) + (0.15 * S_restrictionSafety)',
  dataSources: [
    { name: 'Unified Tree Registry', role: 'Tree spatial coordinates, tree density & root spacing buffers' },
    { name: 'Copernicus Sentinel-2B MSI (10m)', role: 'NDVI vegetation coverage & canopy density' },
    { name: 'USGS Landsat 9 TIRS-2 (30m)', role: 'Land Surface Temperature (LST) heat island detection' },
    { name: 'ISRO NRSC Bhuvan & Campus GIS Survey', role: 'Land-Use Land-Cover (LULC) pervious vs impervious classification' },
    { name: 'Open-Meteo ERA5 Reanalysis', role: 'Regional climate, precipitation & ambient temperature' }
  ],
  status: 'Analytical Screening Tool — Preliminary Recommendations Pending Physical Ground-Truth Inspection'
};

/**
 * Curated Native & Ecologically Adapted Species Catalog for Nashik / Deccan Agro-Climatic Zone
 */
export const NATIVE_SPECIES_CATALOG = [
  {
    species: 'Neem',
    botanicalName: 'Azadirachta indica',
    native: true,
    category: 'Medicinal & Microclimate Cooling',
    minSpacingM: 5.0,
    crownRadiusM: 4.5,
    waterRequirement: 'Low (High drought tolerance once established)',
    soilSuitability: 'Deep black cotton, loamy, gravelly campus soil',
    ecologicalRole: 'Air purification, particulate dust absorption, natural pest repellent',
    preferredLandUse: ['Campus lawns', 'Open pervious clearings', 'Avenue verges'],
    maxUrbanHeatTolerance: 45
  },
  {
    species: 'Rain Tree',
    botanicalName: 'Samanea saman',
    native: false, // Naturalized across Maharashtra urban campuses
    category: 'Spreading Shade Giant',
    minSpacingM: 8.0,
    crownRadiusM: 7.5,
    waterRequirement: 'Moderate',
    soilSuitability: 'Moist, well-draining loamy ground',
    ecologicalRole: 'Massive cooling shade canopy, carbon sequestration, nitrogen fixing',
    preferredLandUse: ['Wide campus lawns', 'Open sports perimeter', 'Peripheral clearings'],
    maxUrbanHeatTolerance: 43
  },
  {
    species: 'Ashoka',
    botanicalName: 'Polyalthia longifolia (False Ashoka)',
    native: true,
    category: 'Columnar Buffer & Windbreak',
    minSpacingM: 3.0,
    crownRadiusM: 2.0,
    waterRequirement: 'Low to Moderate',
    soilSuitability: 'Adaptable to narrow soil verges and boundary alignments',
    ecologicalRole: 'Acoustic noise dampening, vertical privacy, windbreak',
    preferredLandUse: ['Boundary verges', 'Walkway margins', 'Corridor borders'],
    maxUrbanHeatTolerance: 44
  },
  {
    species: 'Banyan',
    botanicalName: 'Ficus benghalensis',
    native: true,
    category: 'Keystone Heritage Shade Giant',
    minSpacingM: 12.0,
    crownRadiusM: 10.0,
    waterRequirement: 'Moderate (Deep taproots tap into groundwater)',
    soilSuitability: 'Extensive root space required, deep soil',
    ecologicalRole: 'Vital bird nesting hub (Bulbuls, Mynas, Parakeets), pollinator sustenance',
    preferredLandUse: ['Large open grounds', 'Central clearings away from buildings'],
    maxUrbanHeatTolerance: 46
  },
  {
    species: 'Peepal',
    botanicalName: 'Ficus religiosa',
    native: true,
    category: 'Sacred Evergreen Keystone',
    minSpacingM: 10.0,
    crownRadiusM: 8.5,
    waterRequirement: 'Low to Moderate',
    soilSuitability: 'Very hardy, resilient',
    ecologicalRole: 'Continuous daytime/nighttime oxygen release, avian biodiversity support',
    preferredLandUse: ['Open peripheral zones', 'Conservation corners'],
    maxUrbanHeatTolerance: 46
  },
  {
    species: 'Gulmohar',
    botanicalName: 'Delonix regia',
    native: false, // Naturalized ornamental
    category: 'Flowering Canopy',
    minSpacingM: 6.0,
    crownRadiusM: 5.0,
    waterRequirement: 'Low (Survives hot dry summers with vibrant flowering)',
    soilSuitability: 'Light sandy or gravelly loam',
    ecologicalRole: 'Urban aesthetics, nectar for bees and butterflies',
    preferredLandUse: ['Campus open spaces', 'Walkway flanks'],
    maxUrbanHeatTolerance: 44
  },
  {
    species: 'Karanj (Indian Beech)',
    botanicalName: 'Pongamia pinnata',
    native: true,
    category: 'Hardy Native Canopy & Biofuel',
    minSpacingM: 5.0,
    crownRadiusM: 4.5,
    waterRequirement: 'Low (Extremely hardy)',
    soilSuitability: 'Tolerates rocky and compacted campus soil',
    ecologicalRole: 'Soil nitrogen enrichment, erosion control, hardy road buffer',
    preferredLandUse: ['Driveway borders', 'Peripheral open soil'],
    maxUrbanHeatTolerance: 45
  }
];

/**
 * Distance to nearest restriction (roads, built structures, or existing tree clusters)
 */
function evaluateSpatialRestrictions(lng, lat, existingTrees, lulc) {
  // 1. Distance to nearest existing tree
  let minTreeDistance = Infinity;
  let nearestTree = null;

  for (const tree of existingTrees) {
    const d = distanceMeters([lng, lat], [tree.lng, tree.lat]);
    if (d < minTreeDistance) {
      minTreeDistance = d;
      nearestTree = tree;
    }
  }

  // 2. Minimum distance threshold to existing trees:
  // Under 5m: Overcrowded, canopy clash, poor seedling sunlight -> Not recommended.
  // 5m to 10m: Acceptable for compact columnar/medium trees.
  // 10m+: High planting space availability.
  let treeDistanceScore = 0;
  if (minTreeDistance < 4.0) {
    treeDistanceScore = 0.05;
  } else if (minTreeDistance < 7.0) {
    treeDistanceScore = 0.45;
  } else if (minTreeDistance < 14.0) {
    treeDistanceScore = 0.85;
  } else {
    treeDistanceScore = 1.0;
  }

  // 3. Proximity to built structures and roadways based on LULC model
  // If LULC is BUILT_UP or ROAD_PAVED, candidate must be disqualified
  let restrictionScore = 1.0;
  let restrictionNote = 'Clear of primary built structures and paved arteries';
  let isRestricted = false;

  if (lulc.classCode === 'BUILT_UP') {
    restrictionScore = 0.0;
    restrictionNote = 'Obstacle: Sits within permanent building concrete footprint';
    isRestricted = true;
  } else if (lulc.classCode === 'ROAD_PAVED') {
    restrictionScore = 0.1;
    restrictionNote = 'Obstacle: Within active vehicular corridor / paved sidewalk buffer';
    isRestricted = true;
  } else if (lulc.classCode === 'EXISTING_CANOPY') {
    restrictionScore = 0.25;
    restrictionNote = 'Saturated: Directly underneath existing mature tree canopy cover';
    isRestricted = true;
  } else if (minTreeDistance < 4.0) {
    restrictionScore = 0.2;
    restrictionNote = `Too close to registered ${nearestTree?.species || 'tree'} (${minTreeDistance.toFixed(1)}m away, min 5m recommended)`;
    isRestricted = true;
  }

  return {
    minTreeDistance: minTreeDistance === Infinity ? 999 : parseFloat(minTreeDistance.toFixed(1)),
    nearestTreeSpecies: nearestTree?.species || 'None nearby',
    treeDistanceScore,
    restrictionScore,
    restrictionNote,
    isRestricted
  };
}

/**
 * Filter and select optimal species for candidate location based on space, temperature and LULC
 */
function selectSuitableSpecies(minTreeDist, surfaceTemp, isHighHeatZone) {
  return NATIVE_SPECIES_CATALOG.filter((spec) => {
    // Space constraint: candidate must have radius >= species minSpacing
    if (minTreeDist < spec.minSpacingM) return false;
    // Thermal constraint
    if (surfaceTemp > spec.maxUrbanHeatTolerance) return false;
    return true;
  }).map((s) => ({
    species: s.species,
    botanicalName: s.botanicalName,
    native: s.native,
    category: s.category,
    crownRadiusM: s.crownRadiusM,
    suitabilityReason: `${s.category}; ${s.waterRequirement}; fits ${minTreeDist.toFixed(1)}m clear radius.`
  })).slice(0, 3);
}

/**
 * Evaluates candidate plantation locations across an arbitrary polygon or predefined zone
 *
 * @param {Array} ring - Closed coordinates ring [[lng, lat], ...]
 * @param {Array} existingTrees - Unified registered trees within or adjacent to the area
 * @param {Function} getGridNDVI - High-res NDVI evaluation function
 * @param {Function} getLST - Land Surface Temperature evaluation function
 * @param {Object} areaSummary - Area metadata (name, total area, etc.)
 */
export function generatePlantationRecommendations({
  ring,
  existingTrees = [],
  getGridNDVI,
  getLST,
  areaSummary = {}
}) {
  const { minLng, minLat, maxLng, maxLat } = getBoundingBox(ring);

  // Systematic grid scanning at ~12m intervals (~0.00011 deg lat/lng)
  // Ensures uniform coverage across selected polygon without artificial randomness
  const gridStep = 0.00011;
  const candidateList = [];

  let candidateIdCounter = 1;

  for (let lat = minLat; lat <= maxLat; lat += gridStep) {
    for (let lng = minLng; lng <= maxLng; lng += gridStep) {
      if (!isPointInPolygon([lng, lat], ring)) continue;

      const ndvi = getGridNDVI(lng, lat);
      const lulc = getLULCClass(lng, lat);
      const lst = getLST(lng, lat, ndvi);

      // Evaluate spatial proximity and restrictions
      const restrictions = evaluateSpatialRestrictions(lng, lat, existingTrees, lulc);

      // If disqualified by physical obstacles or inside building footprint, skip from viable list
      if (restrictions.isRestricted) continue;

      // 1. Existing Tree Deficit Score (Tree Spacing) [0 to 1]
      // Higher score for open pockets with 7-25m clearance from other trees
      const sTreeDist = restrictions.treeDistanceScore;

      // 2. Low Vegetation / Bare Ground Indicator [0 to 1]
      // Low NDVI (0.15 - 0.32) indicates lack of green biomass and urgent opportunity for infill
      // If NDVI >= 0.50, already lush green
      let sVegDeficit = 0.1;
      if (ndvi < 0.20) {
        sVegDeficit = 1.0; // Barren open ground / unshaded patch
      } else if (ndvi < 0.32) {
        sVegDeficit = 0.85; // Sparse lawn or dry grass
      } else if (ndvi < 0.45) {
        sVegDeficit = 0.45; // Moderate shrub/canopy
      } else {
        sVegDeficit = 0.10; // Already dense canopy
      }

      // 3. Land Use Suitability Score [0 to 1]
      // OPEN_PERVIOUS = 0.90 suitability
      const sLulc = lulc.suitabilityScore || 0.5;

      // 4. Urban Heat Island Thermal Urgency [0 to 1]
      // Hotter ground (LST > 39°C) gets higher cooling priority
      const sThermal = Math.min(1.0, Math.max(0.0, (lst - 32) / (43 - 32)));

      // 5. Restriction Safety Score [0 to 1]
      const sSafety = restrictions.restrictionScore;

      // Weighted Multi-Criteria Recommendation Score
      // FinalScore = (0.25 * S_treeDist) + (0.25 * S_vegDeficit) + (0.20 * S_lulc) + (0.15 * S_thermal) + (0.15 * S_safety)
      const rawScore =
        0.25 * sTreeDist +
        0.25 * sVegDeficit +
        0.20 * sLulc +
        0.15 * sThermal +
        0.15 * sSafety;

      const score = parseFloat(Math.min(1.0, Math.max(0.0, rawScore)).toFixed(3));

      // Determine Priority Tier & Marker Color
      // Red: High priority for investigation (score >= 0.70)
      // Orange: Moderate priority (0.55 <= score < 0.70)
      // Green: Potentially suitable location (score < 0.55)
      let priorityTier = 'POTENTIAL';
      let priorityColor = '#10B981'; // Green
      let priorityLabel = 'Potentially Suitable Plantation Location';

      if (score >= 0.70) {
        priorityTier = 'HIGH';
        priorityColor = '#EF4444'; // Red
        priorityLabel = 'High Priority for Further Investigation';
      } else if (score >= 0.55) {
        priorityTier = 'MODERATE';
        priorityColor = '#F59E0B'; // Orange
        priorityLabel = 'Moderate Priority Infill Location';
      }

      // Detailed Reasons
      const reasons = [];
      if (sVegDeficit > 0.7) reasons.push(`Low vegetation coverage (NDVI ${ndvi.toFixed(2)}) indicates bare ground opportunity`);
      if (restrictions.minTreeDistance >= 8.0) reasons.push(`Ample ${restrictions.minTreeDistance}m clearance from nearest tree for healthy root growth`);
      if (lst >= 38.0) reasons.push(`High surface temperature (${lst.toFixed(1)}°C) makes tree canopy cooling beneficial`);
      if (lulc.plantable) reasons.push(`Classified as ${lulc.className} (pervious soil suitable for sapling pit excavation)`);
      if (reasons.length === 0) reasons.push('Open pervious ground with acceptable spacing from existing stands');

      // Suggested Native Species
      const suggestedSpecies = selectSuitableSpecies(restrictions.minTreeDistance, lst, lst >= 38.0);

      // Potential Limitations & Missing Data
      const limitations = [
        'Requires underground utility line clearance (electrical cables, water piping) before digging.',
        'Requires field soil depth check (>1.2m depth recommended for taproot establishment).',
        'Subject to campus planning committee authorization & seasonal monsoon planting timing.'
      ];

      candidateList.push({
        id: `REC-${candidateIdCounter++}`,
        coordinates: {
          lat: parseFloat(lat.toFixed(6)),
          lng: parseFloat(lng.toFixed(6))
        },
        score,
        priorityTier,
        priorityColor,
        priorityLabel,
        ndvi,
        surfaceTemperatureC: lst,
        landUseClass: lulc.className,
        minTreeDistanceMeters: restrictions.minTreeDistance,
        nearestTreeSpecies: restrictions.nearestTreeSpecies,
        reasons,
        limitations,
        suggestedSpecies,
        preliminaryNotice: 'Analytical priority based on satellite & survey data. Field verification required.'
      });
    }
  }

  // Sort candidate locations by score descending
  candidateList.sort((a, b) => b.score - a.score);

  // Spatial clustering filter: Ensure candidate points aren't placed within 6 meters of each other
  const prunedCandidates = [];
  const MIN_CANDIDATE_SPACING_M = 6.0;

  for (const cand of candidateList) {
    let tooClose = false;
    for (const accepted of prunedCandidates) {
      const d = distanceMeters(
        [cand.coordinates.lng, cand.coordinates.lat],
        [accepted.coordinates.lng, accepted.coordinates.lat]
      );
      if (d < MIN_CANDIDATE_SPACING_M) {
        tooClose = true;
        break;
      }
    }
    if (!tooClose) {
      prunedCandidates.push(cand);
    }
    // Limit to top 40 candidate spots per area to ensure fast rendering & readability
    if (prunedCandidates.length >= 40) break;
  }

  // Summary counts
  const highPriorityCount = prunedCandidates.filter((c) => c.priorityTier === 'HIGH').length;
  const moderatePriorityCount = prunedCandidates.filter((c) => c.priorityTier === 'MODERATE').length;
  const potentialPriorityCount = prunedCandidates.filter((c) => c.priorityTier === 'POTENTIAL').length;

  return {
    metadata: RECOMMENDATION_METADATA,
    totalCandidatesIdentified: prunedCandidates.length,
    highPriorityCount,
    moderatePriorityCount,
    potentialPriorityCount,
    prioritySummary: {
      high: { label: 'High Priority (Red)', count: highPriorityCount, color: '#EF4444' },
      moderate: { label: 'Moderate Priority (Orange)', count: moderatePriorityCount, color: '#F59E0B' },
      potential: { label: 'Potentially Suitable (Green)', count: potentialPriorityCount, color: '#10B981' }
    },
    candidates: prunedCandidates,
    topRecommendedSpecies: NATIVE_SPECIES_CATALOG.slice(0, 5).map((s) => ({
      species: s.species,
      botanicalName: s.botanicalName,
      category: s.category,
      native: s.native,
      waterRequirement: s.waterRequirement,
      ecologicalRole: s.ecologicalRole
    }))
  };
}

import { getAllUnifiedTrees } from './treeDataLoader.js';
import { distanceMeters, isPointInPolygon, validatePolygon } from './spatialUtils.js';
import { STUDY_ZONES } from './studyZones.js';

/**
 * Computes verified tree inventory overlap and environmental loss metrics
 * for a proposed tree-cutting geographical area.
 */
export async function calculateCuttingImpact({
  latitude,
  longitude,
  polygonGeometry = null,
  bufferRadiusMeters = 80, // Default 80-meter impact buffer around point
  estimatedTreesAffected = 1,
}) {
  const allTrees = await getAllUnifiedTrees();

  const lat = Number(latitude);
  const lng = Number(longitude);

  let isPolygonValid = false;
  let polygonRing = null;

  if (polygonGeometry) {
    const check = validatePolygon(polygonGeometry);
    if (check.valid && check.ring) {
      isPolygonValid = true;
      polygonRing = check.ring;
    }
  }

  const impactedTrees = [];

  for (const tree of allTrees) {
    const tLat = Number(tree.lat);
    const tLng = Number(tree.lng);
    if (isNaN(tLat) || isNaN(tLng)) continue;

    let isInside = false;

    if (isPolygonValid && polygonRing) {
      isInside = isPointInPolygon([tLng, tLat], polygonRing);
    } else if (!isNaN(lat) && !isNaN(lng)) {
      const dist = distanceMeters([tLng, tLat], [lng, lat]);
      if (dist <= bufferRadiusMeters) {
        isInside = true;
      }
    }

    if (isInside) {
      const dbh = Number(tree.dbh) || (tree.gbh ? Number(tree.gbh) / Math.PI : 25);
      const height = Number(tree.height) || 8;
      // Allometric biomass estimation (Chave formula: 0.0673 * (density * dbh^2 * height)^0.976)
      const density = 0.6;
      const biomassKg = Math.round(0.0673 * Math.pow(density * Math.pow(dbh, 2) * height, 0.976));
      const carbonKg = Math.round(biomassKg * 0.475);
      const co2Kg = Math.round(carbonKg * 3.67);
      const oxygenKg = Math.round(co2Kg * 0.727);

      impactedTrees.push({
        id: String(tree.id || tree.treeId),
        species: tree.species || 'Unknown Native',
        lat: tLat,
        lng: tLng,
        dbh: Math.round(dbh * 10) / 10,
        height: Math.round(height * 10) / 10,
        biomassKg,
        carbonKg,
        co2: co2Kg,
        oxygenKg,
      });
    }
  }

  const verifiedTreeCount = impactedTrees.length;
  const totalBiomassLossKg = impactedTrees.reduce((acc, t) => acc + (t.biomassKg || 0), 0);
  const totalCarbonLossKg = impactedTrees.reduce((acc, t) => acc + (t.carbonKg || 0), 0);
  const totalOxygenLossKg = impactedTrees.reduce((acc, t) => acc + (t.oxygenKg || 0), 0);

  // Check proximity to predefined study / conservation zones
  const nearbyZones = [];
  if (!isNaN(lat) && !isNaN(lng) && Array.isArray(STUDY_ZONES)) {
    for (const zone of STUDY_ZONES) {
      if (zone.bounds) {
        const zoneLat = (zone.bounds.north + zone.bounds.south) / 2;
        const zoneLng = (zone.bounds.east + zone.bounds.west) / 2;
        const d = distanceMeters([lng, lat], [zoneLng, zoneLat]);
        if (d <= 500) {
          nearbyZones.push(`${zone.name} (${Math.round(d)}m away)`);
        }
      }
    }
  }

  // Statutory minimum compensatory plantation ratio (Maharashtra Tree Act 1975 mandates 1:5 ratio)
  const statutoryRatio = 5;
  const baseCount = Math.max(Number(estimatedTreesAffected) || 1, verifiedTreeCount);
  const requiredCompensatorySaplings = baseCount * statutoryRatio;

  return {
    verifiedTreeCount,
    verifiedTrees: impactedTrees.slice(0, 50), // Cap list preview to 50
    estimatedBiomassLossKg: totalBiomassLossKg,
    estimatedCarbonLossKg: totalCarbonLossKg,
    estimatedOxygenLossKg: totalOxygenLossKg,
    nearbyProtectedZones: nearbyZones,
    statutoryCompensatoryRatio: statutoryRatio,
    requiredCompensatorySaplings,
    legalMandate:
      'Maharashtra (Urban Areas) Protection and Preservation of Trees Act, 1975 mandates minimum 1:5 compensatory sapling replanting and 3-year survival monitoring.',
  };
}

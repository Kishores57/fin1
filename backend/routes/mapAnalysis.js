import express from 'express';
import { STUDY_ZONES } from '../services/studyZones.js';
import { validatePolygon, calculateGeodesicArea, isPointInPolygon } from '../services/spatialUtils.js';
import { getAllUnifiedTrees } from '../services/treeDataLoader.js';
import { analyzeVegetationInPolygon, getGridNDVI, SENTINEL2_METADATA } from '../services/vegetationService.js';
import { analyzeLULCInPolygon, LULC_METADATA } from '../services/lulcService.js';
import { getLandSurfaceTemperature, getHistoricalClimate, getRealtimeWeather, CLIMATE_METADATA } from '../services/climateService.js';
import { calculatePlantationPriority, PRIORITY_METADATA } from '../services/plantationPriorityService.js';
import { simulatePlantation } from '../services/plantationSimulatorService.js';
import { generatePlantationRecommendations, RECOMMENDATION_METADATA } from '../services/recommendationService.js';
import { computeCampusForestStory } from '../services/campusForestStoryService.js';

const router = express.Router();

// In-memory cache for comprehensive area analysis results
const analysisCache = new Map();

/**
 * GET /api/map-analysis/zones
 * Returns available predefined geographical study zones
 */
router.get('/zones', (req, res) => {
  res.json({
    zones: STUDY_ZONES,
    totalZones: STUDY_ZONES.length,
    description: 'Predefined survey study zones in Nashik region for rapid GIS area assessment',
  });
});

/**
 * GET /api/map-analysis/environmental-comparison
 * Directly compares environmental indicators across all predefined campus zones
 */
router.get('/environmental-comparison', async (req, res) => {
  try {
    const allTrees = await getAllUnifiedTrees();
    const comparisons = [];

    for (const zone of STUDY_ZONES) {
      const validation = validatePolygon(zone.boundary);
      if (!validation.valid) continue;
      const ring = validation.ring;
      const areaSqM = calculateGeodesicArea(ring);
      const areaSqKm = areaSqM / 1_000_000;

      let treeCount = 0;
      for (const t of allTrees) {
        if (isPointInPolygon([t.lng, t.lat], ring)) treeCount++;
      }
      const treeDensity = areaSqKm > 0 ? parseFloat((treeCount / areaSqKm).toFixed(1)) : 0;
      const veg = analyzeVegetationInPolygon(ring, areaSqM);
      const lulc = analyzeLULCInPolygon(ring, areaSqM);
      const centerLng = (ring[0][0] + ring[Math.floor(ring.length / 2)][0]) / 2;
      const centerLat = (ring[0][1] + ring[Math.floor(ring.length / 2)][1]) / 2;
      const lst = getLandSurfaceTemperature(centerLng, centerLat, veg.meanNDVI);

      const priority = calculatePlantationPriority({
        treeDensityPerKm2: treeDensity,
        meanNDVI: veg.meanNDVI,
        meanLST: lst,
        potentialPlantingPercent: lulc.potentialPlantingPercent,
      });

      comparisons.push({
        zoneId: zone.id,
        zoneName: zone.name,
        areaSqKm: parseFloat(areaSqKm.toFixed(3)),
        treeCount,
        treeDensityPerKm2: treeDensity,
        meanNDVI: veg.meanNDVI,
        highVegetationPercent: veg.classes?.high?.percentage || 0,
        landSurfaceTemperatureC: lst,
        plantableOpenSpacePercent: lulc.potentialPlantingPercent,
        plantationPriorityScore: priority.priorityScore,
        priorityLevel: priority.priorityLevel,
      });
    }

    res.json({
      comparisons,
      timestamp: new Date().toISOString(),
      metadata: {
        ndviSource: 'Copernicus Sentinel-2B MSI (10m)',
        lstSource: 'USGS Landsat 9 TIRS-2 (30m)',
        treeSource: 'VanJeevan Unified Registry (MongoDB & SQLite)',
      },
    });
  } catch (err) {
    console.error('Environmental comparison error:', err);
    res.status(500).json({ error: 'Failed to compile comparisons', message: err.message });
  }
});

/**
 * POST /api/map-analysis/analyze
 * Comprehensive area analysis for a custom drawn polygon or predefined zone
 */
router.post('/analyze', async (req, res) => {
  try {
    const { zoneId, geometry, areaName, customWeights } = req.body;

    let targetGeometry = geometry;
    let selectedName = areaName || 'Custom Selected Area';

    if (zoneId) {
      const foundZone = STUDY_ZONES.find((z) => z.id === zoneId);
      if (foundZone) {
        targetGeometry = foundZone.boundary;
        selectedName = foundZone.name;
      } else {
        return res.status(404).json({ error: `Zone with ID '${zoneId}' not found.` });
      }
    }

    // 1. Validate Polygon Geometry
    const validation = validatePolygon(targetGeometry);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Invalid polygon geometry provided',
        details: validation.error,
      });
    }

    const ring = validation.ring;

    // 2. Geodesic Area Calculation
    const areaSqM = calculateGeodesicArea(ring);
    const areaSqKm = areaSqM / 1_000_000;

    // 3. Tree Counting & Spatial Filtering
    const allTrees = await getAllUnifiedTrees();
    const treesInside = [];
    const speciesCount = {};

    for (const tree of allTrees) {
      if (isPointInPolygon([tree.lng, tree.lat], ring)) {
        treesInside.push(tree);
        const sp = tree.species || 'Unknown';
        speciesCount[sp] = (speciesCount[sp] || 0) + 1;
      }
    }

    const treeCount = treesInside.length;
    const treeDensityPerKm2 = areaSqKm > 0 ? parseFloat((treeCount / areaSqKm).toFixed(2)) : 0;
    const uniqueSpeciesCount = Object.keys(speciesCount).length;

    // Sort species by frequency
    const speciesDistribution = Object.entries(speciesCount)
      .map(([species, count]) => ({
        species,
        count,
        percentage: parseFloat(((count / treeCount) * 100).toFixed(1)),
      }))
      .sort((a, b) => b.count - a.count);

    // 4. Sentinel-2 NDVI Vegetation Coverage
    const vegetation = analyzeVegetationInPolygon(ring, areaSqM);

    // 5. Land-Use / Land-Cover (LULC) Classification
    const lulc = analyzeLULCInPolygon(ring, areaSqM);

    // 6. Land Surface Temperature (USGS Landsat TIRS)
    const centerLng = (ring[0][0] + ring[Math.floor(ring.length / 2)][0]) / 2;
    const centerLat = (ring[0][1] + ring[Math.floor(ring.length / 2)][1]) / 2;
    const meanLST = getLandSurfaceTemperature(centerLng, centerLat, vegetation.meanNDVI);

    // 7. Plantation Priority Analysis
    const priority = calculatePlantationPriority({
      treeDensityPerKm2,
      meanNDVI: vegetation.meanNDVI,
      meanLST,
      potentialPlantingPercent: lulc.potentialPlantingPercent,
      customWeights,
    });

    // 8. Climate History & Real-Time Weather (Open-Meteo)
    const climateHistory = await getHistoricalClimate(centerLat, centerLng);
    const realtimeWeather = await getRealtimeWeather(centerLat, centerLng);

    // 9. Generate Location-Specific Plantation Recommendations
    const recommendations = generatePlantationRecommendations({
      ring,
      existingTrees: treesInside,
      getGridNDVI,
      getLST: getLandSurfaceTemperature,
      areaSummary: {
        name: selectedName,
        zoneId: zoneId || null,
        areaSqM,
        areaSqKm,
      },
    });

    // 10. Generate Intuitive Campus Forest Story & All-Tree Intelligence
    const campusForestIntelligence = computeCampusForestStory(treesInside, areaSqM, allTrees);

    const responsePayload = {
      areaSummary: {
        name: selectedName,
        zoneId: zoneId || null,
        areaSqM: parseFloat(areaSqM.toFixed(1)),
        areaSqKm: parseFloat(areaSqKm.toFixed(4)),
        centerCoordinates: {
          lat: parseFloat(centerLat.toFixed(6)),
          lng: parseFloat(centerLng.toFixed(6)),
        },
      },
      campusForestIntelligence,
      treeStatistics: {
        totalRegisteredTrees: treeCount,
        treeDensityPerKm2,
        uniqueSpeciesCount,
        speciesDistribution,
        treesInside: treesInside.map((t) => ({
          id: t.id,
          species: t.species,
          source: t.source,
          lat: t.lat,
          lng: t.lng,
          age: t.age,
          height: t.height,
          gbh: t.gbh,
        })),
      },
      vegetationAnalysis: vegetation,
      landUseAnalysis: lulc,
      thermalAndClimate: {
        metadata: CLIMATE_METADATA,
        landSurfaceTemperatureC: meanLST,
        historicalClimate: climateHistory,
        realtimeWeather,
      },
      plantationPriority: priority,
      recommendations,
      analysisTimestamp: new Date().toISOString(),
    };

    return res.json(responsePayload);
  } catch (err) {
    console.error('Error during area analysis:', err);
    return res.status(500).json({
      error: 'Failed to complete geospatial area analysis',
      message: err.message,
    });
  }
});

/**
 * POST /api/map-analysis/recommendations
 * Direct endpoint for generating location-specific recommendations
 */
router.post('/recommendations', async (req, res) => {
  try {
    const { zoneId, geometry, areaName } = req.body;
    let targetGeometry = geometry;
    let selectedName = areaName || 'Custom Selected Area';

    if (zoneId) {
      const foundZone = STUDY_ZONES.find((z) => z.id === zoneId);
      if (foundZone) {
        targetGeometry = foundZone.boundary;
        selectedName = foundZone.name;
      } else {
        return res.status(404).json({ error: `Zone with ID '${zoneId}' not found.` });
      }
    }

    const validation = validatePolygon(targetGeometry);
    if (!validation.valid) {
      return res.status(400).json({ error: 'Invalid polygon geometry provided', details: validation.error });
    }

    const ring = validation.ring;
    const allTrees = await getAllUnifiedTrees();
    const treesInside = allTrees.filter((t) => isPointInPolygon([t.lng, t.lat], ring));

    const recommendations = generatePlantationRecommendations({
      ring,
      existingTrees: treesInside,
      getGridNDVI,
      getLST: getLandSurfaceTemperature,
      areaSummary: { name: selectedName, zoneId: zoneId || null },
    });

    res.json(recommendations);
  } catch (err) {
    console.error('Recommendations endpoint error:', err);
    res.status(500).json({ error: 'Failed to generate recommendations', message: err.message });
  }
});

/**
 * POST /api/map-analysis/simulate
 * Simulates plantation scenarios without persisting changes to SQLite or MongoDB
 */
router.post('/simulate', (req, res) => {
  try {
    const {
      currentTreeCount,
      proposedAdditionalTrees,
      availablePlantingAreaSqM,
      totalAreaSqM,
    } = req.body;

    const simulation = simulatePlantation({
      currentTreeCount,
      proposedAdditionalTrees,
      availablePlantingAreaSqM,
      totalAreaSqM,
    });

    res.json(simulation);
  } catch (err) {
    console.error('Plantation simulation error:', err);
    res.status(500).json({ error: 'Simulation failed', message: err.message });
  }
});

export default router;

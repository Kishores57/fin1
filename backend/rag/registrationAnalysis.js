import { resolveSpeciesMeta } from './speciesCatalog.js';
import {
  buildLocalClimateSummary,
  buildLocalMedicinalSummary,
  buildLocalHabitatSummary,
} from './localSpeciesPacks.js';

function section(title, body) {
  return { title, body: body || 'Data not available for this species pack.' };
}

/**
 * Build the permanent registration analysis document from local RAG packs.
 * Gemini enrichment is optional and only used when explicitly requested.
 */
export function buildRegistrationAnalysis(species, calculations) {
  const meta = resolveSpeciesMeta(species);
  const climate = buildLocalClimateSummary(
    species,
    calculations.age,
    calculations.aboveGroundBiomass,
    calculations.carbonStorage,
    calculations.co2Sequestration
  );
  const medicinal = buildLocalMedicinalSummary(species) || {};
  const habitat = buildLocalHabitatSummary(species) || {};

  const pick = (key, fallback) =>
    climate?.[key]?.scientific_explanation ||
    climate?.[key]?.short_description ||
    fallback;

  return {
    generalDescription: {
      speciesOverview: pick(
        'identification',
        `${meta.common} (${meta.scientific}) is registered for climatic inventory analysis.`
      ),
      habitat: pick('habitat', habitat.description || ''),
      nativeRegion: pick('distribution', ''),
      growthCharacteristics: pick('description', ''),
    },
    climaticImpact: {
      carbonSequestration: `Stored carbon ≈ ${calculations.carbonStorage} kg; CO₂ equivalent ≈ ${calculations.co2Sequestration} kg; annual absorption ≈ ${calculations.annualCo2Absorption} kg/yr.`,
      oxygenProduction: `Estimated oxygen released ≈ ${calculations.oxygenReleased} kg based on carbon stoichiometry.`,
      coolingEffect: `Seasonal cooling proxy ≈ ${calculations.coolingEffect} kWh-equivalent from ${calculations.canopyArea} m² canopy.`,
      urbanClimateBenefits: pick(
        'climate_impact',
        'Urban canopy reduces radiant heat and improves microclimate comfort.'
      ),
      heatIslandReduction: `Heat-island reduction score ≈ ${calculations.heatIslandReduction}/100 for this tree.`,
    },
    biodiversity: {
      birdNestingSuitability: (habitat.birds || []).slice(0, 5).join(', ') || pick('biodiversity_associations', ''),
      pollinatorSupport: pick('pollinators', ''),
      butterflyHabitat: (habitat.insects || []).filter((x) => /butter/i.test(x)).join(', ') ||
        'Insect visitors supported during flowering seasons.',
      beeAttraction: (habitat.insects || []).filter((x) => /bee/i.test(x)).join(', ') ||
        pick('pollinators', 'Seasonal nectar/pollen value for bees.'),
      foodSource: pick('biodiversity_associations', habitat.description || ''),
      wildlifeSupport: (habitat.mammals || []).join(', ') || habitat.description || '',
      birds: habitat.birds || [],
      insects: habitat.insects || [],
      mammals: habitat.mammals || [],
      description: habitat.description || '',
    },
    canopyAnalysis: {
      shadeQuality: pick('climate_impact', `Shade area ≈ ${calculations.shadeArea} m².`),
      leafDensity: pick('description', 'Leaf density varies with season and species habit.'),
      canopySpread: `Crown diameter ≈ ${calculations.crownDiameter} m; canopy area ≈ ${calculations.canopyArea} m²; coverage ≈ ${calculations.canopyCoverage}%.`,
      rainInterception: `Estimated rainwater interception ≈ ${calculations.rainwaterInterception} L/yr.`,
      microclimateImprovement: pick(
        'ecological_importance',
        'Canopy intercepts radiation and moderates near-ground temperatures.'
      ),
    },
    medicinalValue: {
      leaves: medicinal.applications?.[0] || pick('medicinal_uses', ''),
      bark: medicinal.applications?.[1] || '',
      flowers: medicinal.applications?.[2] || '',
      fruits: medicinal.applications?.find((a) => /fruit/i.test(a)) || '',
      roots: medicinal.applications?.find((a) => /root/i.test(a)) || '',
      seeds: medicinal.applications?.find((a) => /seed/i.test(a)) || '',
      traditionalUses: medicinal.description || pick('medicinal_uses', ''),
      compounds: medicinal.compounds || [],
      applications: medicinal.applications || [],
      diseases: medicinal.diseases || [],
    },
    culturalImportance: {
      religiousSignificance: pick('cultural_spirituality', ''),
      sacredValue: climate?.cultural_spirituality?.interesting_fact || '',
      culturalImportance: climate?.cultural_spirituality?.importance || '',
      traditionalPlantingPractices: climate?.cultural_spirituality?.real_world_example || '',
    },
    pollutionControl: {
      dustTrapping: `Canopy particulate trapping proxy linked to ${calculations.airPollutionRemoval} kg/yr air-pollution removal estimate.`,
      airPurification: `PM2.5 reduction proxy ≈ ${calculations.pm25Reduction} kg/yr.`,
      carbonCapture: `${calculations.co2Sequestration} kg CO₂ sequestered (lifetime estimate for current biomass).`,
      noiseReduction: `Dense crowns of ${meta.common} can attenuate street noise modestly depending on planting density.`,
    },
    climateResilience: {
      heatTolerance: pick('climate_preference', ''),
      droughtResistance: pick('soil', ''),
      floodTolerance: climate?.habitat?.interesting_fact || '',
      windResistance: pick('diseases_pests', 'Structural health and pruning affect wind failure risk.'),
    },
    conservationStatus: {
      nativeOrExotic: pick('distribution', ''),
      invasivePotential: climate?.conservation_status?.interesting_fact || 'Assess locally before mass planting.',
      conservationImportance: pick('conservation_status', ''),
    },
    maintenance: {
      waterRequirement: pick('climate_preference', 'Match irrigation to local climate and soil drainage.'),
      fertilizerRecommendation: pick('soil', 'Prefer organic mulch; avoid over-fertilization.'),
      pruningSchedule: 'Prune dead/diseased wood in dormant or post-monsoon windows; avoid heavy cuts during flowering.',
      diseaseMonitoring: pick('diseases_pests', 'Inspect canopy and trunk seasonally.'),
    },
    researchPipeline: climate?.research_pipeline || [
      'FAO',
      'ICRAF',
      'USDA',
      'GBIF',
      'India Biodiversity Portal',
      'Forest Survey of India',
    ],
    sourceClimatePack: climate || null,
  };
}

export default { buildRegistrationAnalysis };

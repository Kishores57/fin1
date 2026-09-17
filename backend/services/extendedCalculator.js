import { CalculatorService } from './calculator.js';

function round(n, d = 2) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  const f = 10 ** d;
  return Math.round(x * f) / f;
}

/**
 * Full climatic / environmental calculation module for registered trees.
 * Reuses existing Chave allometry, then derives canopy / pollution / cooling metrics.
 */
export function computeEnvironmentalParameters({
  speciesRow,
  gbh,
  height,
  crownDiameter = null,
  ageOverride = null,
}) {
  const base = CalculatorService.processTreeCalculations(speciesRow, gbh, height);
  const age = ageOverride && ageOverride > 0 ? Number(ageOverride) : base.age;
  const agb = base.biomass;
  const bgb = agb * 0.26; // IPCC root:shoot approximation
  const totalBiomass = agb + bgb;
  const carbon = totalBiomass * 0.47;
  const co2 = carbon * 3.67;
  const oxygen = carbon * 2.67;
  const annualCo2 = age > 0 ? co2 / age : co2;

  const crownM =
    crownDiameter && crownDiameter > 0
      ? Number(crownDiameter)
      : Math.max(1.2, Math.min(height * 0.55, base.dbh / 10 + 2));
  const canopyArea = Math.PI * (crownM / 2) ** 2;
  const shadeArea = canopyArea * 0.85;
  const canopyCoverage = Math.min(100, (canopyArea / 100) * 100); // % of 100 m² reference plot

  // i-Tree inspired order-of-magnitude urban tree estimates (scaled by canopy)
  const airPollutionRemoval = canopyArea * 0.012; // kg/yr particulate + gases proxy
  const pm25Reduction = airPollutionRemoval * 0.18;
  const rainwaterInterception = canopyArea * 8.5; // liters/yr proxy
  const coolingEffect = canopyArea * 0.35; // kWh equivalent cooling proxy / season
  const heatIslandReduction = Math.min(100, canopyArea * 1.8 + Math.min(age, 25));
  const soilStabilizationScore = Math.min(
    100,
    35 + Math.min(base.dbh, 80) * 0.4 + Math.min(age, 30)
  );

  return {
    aboveGroundBiomass: round(agb),
    belowGroundBiomass: round(bgb),
    totalBiomass: round(totalBiomass),
    carbonStorage: round(carbon),
    co2Sequestration: round(co2),
    annualCo2Absorption: round(annualCo2),
    oxygenReleased: round(oxygen),
    canopyArea: round(canopyArea),
    canopyCoverage: round(canopyCoverage),
    shadeArea: round(shadeArea),
    airPollutionRemoval: round(airPollutionRemoval),
    pm25Reduction: round(pm25Reduction),
    rainwaterInterception: round(rainwaterInterception),
    coolingEffect: round(coolingEffect),
    heatIslandReduction: round(heatIslandReduction),
    soilStabilizationScore: round(soilStabilizationScore),
    // aliases kept for UI compatibility
    dbh: round(base.dbh),
    age: round(age, 1),
    gbh: round(gbh),
    height: round(height),
    crownDiameter: round(crownM),
    woodDensity: speciesRow.wood_density,
  };
}

export default { computeEnvironmentalParameters };

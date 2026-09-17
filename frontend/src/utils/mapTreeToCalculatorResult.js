/**
 * Maps a MongoDB registered tree (calculator-saved or Register Tree)
 * into the shape expected by ResultCard / the calculator results page.
 * Does not mutate the source document.
 */
export function mapRegisteredTreeToCalculatorResult(tree) {
  if (!tree) return null;

  const calc = tree.calculations || {};
  const climatic = tree.climaticAnalysis || {};
  const medicinal = tree.medicinalValue || climatic.medicinalValue || {};
  const habitat = tree.biodiversity || climatic.biodiversity || {};

  let summary = '';
  if (climatic.sourceClimatePack && typeof climatic.sourceClimatePack === 'object') {
    summary = JSON.stringify(climatic.sourceClimatePack);
  } else if (typeof tree.summary === 'string') {
    summary = tree.summary;
  }

  const medicinal_impact = JSON.stringify({
    compounds: medicinal.compounds || [],
    applications: medicinal.applications || [],
    diseases: medicinal.diseases || [],
    description:
      medicinal.traditionalUses ||
      medicinal.description ||
      [medicinal.leaves, medicinal.bark, medicinal.flowers].filter(Boolean).join(' ') ||
      '',
  });

  const habitat_support = JSON.stringify({
    birds: habitat.birds || [],
    insects: habitat.insects || [],
    mammals: habitat.mammals || [],
    description:
      habitat.description ||
      habitat.foodSource ||
      habitat.wildlifeSupport ||
      habitat.birdNestingSuitability ||
      '',
  });

  return {
    species_name: tree.species || tree.commonName || tree.treeName || 'Unknown',
    gbh: Number(tree.gbh ?? calc.gbh) || 0,
    height: Number(tree.height ?? calc.height) || 0,
    dbh: Number(tree.dbh ?? calc.dbh) || 0,
    age: Number(tree.age ?? calc.age) || 0,
    biomass: Number(calc.aboveGroundBiomass ?? calc.totalBiomass ?? tree.biomass) || 0,
    carbon: Number(calc.carbonStorage ?? tree.carbon) || 0,
    co2: Number(calc.co2Sequestration ?? tree.co2) || 0,
    oxygen: Number(calc.oxygenReleased ?? tree.oxygen) || 0,
    summary,
    medicinal_impact,
    habitat_support,
    latitude: tree.latitude != null ? Number(tree.latitude) : null,
    longitude: tree.longitude != null ? Number(tree.longitude) : null,
    treeId: tree.treeId,
    fromMap: true,
  };
}

/**
 * Campus Forest Intelligence & Storytelling Service
 * Translates complex GIS and allometric data into clear, human-friendly campus forest insights.
 * 
 * Provides:
 * 1. Total Living Canopy Coverage (area, %, shade, cooling impact)
 * 2. Most Occurring Tree (dominant species, count, %, campus role)
 * 3. Most Unique Tree in that Zone & Area (rarest botanical asset, coordinates, significance)
 * 4. Which Tree is Contributing Most (Ecological Champion, CO2, oxygen, shade)
 * 5. Why Trees Matter on Campus (Plain-language impact cards: cooling, noise/dust, water, biology, focus)
 * 6. All-Tree Campus Forest Ledger (Aggregate carbon, oxygen, rainwater, species leaderboard across ALL trees)
 */

export function getSpeciesTraits(speciesName = '') {
  const s = String(speciesName).toLowerCase();
  if (s.includes('rain')) {
    return {
      woodDensity: 0.52,
      crownRatio: 0.95,
      minCrown: 6.5,
      maxCrown: 22,
      category: 'Spreading Canopy Giant',
      role: 'Dominant Cooling Umbrella & Nitrogen Fixer',
      campusSignificance: 'Forms an expansive leafy umbrella over campus pathways, dropping ground temperatures by up to 5°C and naturally fixing nitrogen into the soil.',
      icon: 'rain',
    };
  }
  if (s.includes('ashok') || s.includes('asoka')) {
    return {
      woodDensity: 0.62,
      crownRatio: 0.28,
      minCrown: 2.2,
      maxCrown: 6.5,
      category: 'Columnar Acoustic Buffer',
      role: 'Acoustic Sound Barrier & Dust Filter',
      campusSignificance: 'Planted along campus roads and lecture blocks. Its dense vertical foliage dampens traffic noise from approach roads and traps vehicle exhaust particulates.',
      icon: 'columnar',
    };
  }
  if (s.includes('coconut')) {
    return {
      woodDensity: 0.50,
      crownRatio: 0.35,
      minCrown: 3.5,
      maxCrown: 7.0,
      category: 'Tropical Palm Canopy',
      role: 'Vertical Corridor Accent & Soil Stabilizer',
      campusSignificance: 'Iconic vertical tree lines along campus boundaries and hostels, resilient to seasonal Nashik monsoon winds without blocking walkway light.',
      icon: 'palm',
    };
  }
  if (s.includes('child palm') || s.includes('chinese palm') || s.includes('palm')) {
    return {
      woodDensity: 0.50,
      crownRatio: 0.35,
      minCrown: 2.8,
      maxCrown: 6.5,
      category: 'Ornamental Fan Palm',
      role: 'Horticultural Accent & Microhabitat',
      campusSignificance: 'A distinct fan-palm specimen adding aesthetic biodiversity to university lawns and supporting campus bird nesting.',
      icon: 'palm',
    };
  }
  if (s.includes('bamboo')) {
    return {
      woodDensity: 0.60,
      crownRatio: 0.40,
      minCrown: 2.5,
      maxCrown: 6.5,
      category: 'Giant Perennial Grass',
      role: 'Fast Biomass Accumulator & Soil Binder',
      campusSignificance: 'Forms dense green clumps that cool localized breeze, prevents slope erosion near sports grounds, and produces continuous biomass.',
      icon: 'bamboo',
    };
  }
  if (s.includes('guava')) {
    return {
      woodDensity: 0.65,
      crownRatio: 0.60,
      minCrown: 3.0,
      maxCrown: 8.0,
      category: 'Fruiting Bio-Attractor',
      role: 'Fruit Provider & Avian Magnet',
      campusSignificance: 'A rare fruiting tree on academic campus grounds. Acts as a vital biodiversity magnet for campus parakeets, fruit bats, and pollinators that typical ornamental trees do not feed.',
      icon: 'fruit',
    };
  }
  if (s.includes('neem')) {
    return {
      woodDensity: 0.72,
      crownRatio: 0.70,
      minCrown: 4.5,
      maxCrown: 16,
      category: 'Medicinal Air Purifier',
      role: 'Natural Biocide & Microclimate Cooler',
      campusSignificance: 'Purifies campus ambient air, releases phytoncides that deter pests naturally, and survives dry Nashik winters with zero irrigation.',
      icon: 'deciduous',
    };
  }
  if (s.includes('banyan') || s.includes('peepal') || s.includes('ficus')) {
    return {
      woodDensity: 0.48,
      crownRatio: 1.05,
      minCrown: 7.0,
      maxCrown: 25,
      category: 'Keystone Heritage Shade Giant',
      role: 'Avian Sanctuary & Continuous Oxygen Provider',
      campusSignificance: 'A keystone ecological anchor on campus providing daytime and nighttime oxygen, bird roosting for dozens of native species, and deep groundwater recharge.',
      icon: 'keystone',
    };
  }
  return {
    woodDensity: 0.58,
    crownRatio: 0.65,
    minCrown: 3.0,
    maxCrown: 15,
    category: 'Native Shade Tree',
    role: 'Carbon Reservoir & Wildlife Habitat',
    campusSignificance: 'Contributes to total campus canopy cover, intercepting rain and providing quiet shade for student recreation.',
    icon: 'tree',
  };
}

export function computeCampusForestStory(treesInside, areaSqM, allTrees = []) {
  if (!treesInside || treesInside.length === 0) {
    return {
      hasTrees: false,
      summary: 'No registered trees found inside this boundary.',
      canopyCovered: {
        totalCanopyAreaSqM: 0,
        totalShadeAreaSqM: 0,
        canopyCoverPercent: 0,
        shadedHectares: 0,
        walkwayMeters: 0,
        coolingDegrees: '0.0°C',
        plainLanguageSummary: 'No tree canopy detected within this selected boundary.',
      },
      mostOccurringTree: null,
      mostUniqueTree: null,
      topContributingTree: null,
      whyTreesMatter: [],
      campusLedger: {
        totalTrees: 0,
        totalBiomassTonnes: 0,
        totalCarbonTonnes: 0,
        totalCo2StoredTonnes: 0,
        totalAnnualCo2Kg: 0,
        totalDailyOxygenKg: 0,
        totalPeopleOxygenSupplied: 0,
        totalRainwaterInterceptionLiters: 0,
        totalAirPollutionRemovedKg: 0,
        speciesLeaderboard: [],
        maturityProfile: [],
      },
    };
  }

  // Count campus-wide species for global rarity
  const allCampusSpeciesCounts = {};
  for (const t of allTrees) {
    const sp = t.species || 'Unknown';
    allCampusSpeciesCounts[sp] = (allCampusSpeciesCounts[sp] || 0) + 1;
  }

  // Process all trees with full allometrics
  let totalRawCanopySqM = 0;
  let totalBiomassKg = 0;
  let totalCarbonKg = 0;
  let totalCo2StoredKg = 0;
  let totalAnnualCo2Kg = 0;
  let totalDailyOxygenKg = 0;
  let totalRainwaterLiters = 0;
  let totalAirPollutionKg = 0;

  const speciesStats = {};
  const maturityBins = {
    young: 0,      // < 50 yrs
    maturing: 0,   // 50 - 120 yrs
    mature: 0,     // 120 - 200 yrs
    heritage: 0,   // > 200 yrs
  };

  const enrichedTrees = treesInside.map((tree) => {
    const traits = getSpeciesTraits(tree.species);
    const dbh = Number(tree.dbh) || (tree.gbh ? Number(tree.gbh) / Math.PI : 25);
    const height = Number(tree.height) || Math.min(22, Math.max(5.5, dbh * 0.38 + 2.5));
    const age = Number(tree.age) || Math.round(dbh / 0.7);

    // Crown diameter & Canopy area
    const crownDiameter = Math.max(
      traits.minCrown,
      Math.min(traits.maxCrown, height * traits.crownRatio)
    );
    const canopyArea = Math.PI * Math.pow(crownDiameter / 2, 2);
    const shadeArea = canopyArea * 0.85;

    // Biomass (Chave formula: 0.0673 * (woodDensity * dbh^2 * height)^0.976)
    const biomassKg = Math.round(
      0.0673 * Math.pow(traits.woodDensity * Math.pow(dbh, 2) * height, 0.976)
    );
    const carbonKg = Math.round(biomassKg * 0.475);
    const co2Kg = Math.round(carbonKg * 3.67);
    // Allometric annual sequestration rate (calibrated with i-Tree urban standards: 18-65 kg/yr for mature trees)
    const annualCo2Kg = Math.max(18, Math.min(65, Math.round(co2Kg / Math.max(15, Math.min(age, 45)))));
    const annualOxygenKg = Math.round(annualCo2Kg * 0.727);
    const dailyOxygenKg = parseFloat((annualOxygenKg / 365).toFixed(3));
    const rainwaterLiters = Math.round(canopyArea * 8.5);
    const airPollutionKg = parseFloat((canopyArea * 0.015).toFixed(2));

    // Accumulate zone totals
    totalRawCanopySqM += canopyArea;
    totalBiomassKg += biomassKg;
    totalCarbonKg += carbonKg;
    totalCo2StoredKg += co2Kg;
    totalAnnualCo2Kg += annualCo2Kg;
    totalDailyOxygenKg += dailyOxygenKg;
    totalRainwaterLiters += rainwaterLiters;
    totalAirPollutionKg += airPollutionKg;

    // Species tracking
    const sp = tree.species || 'Unknown';
    if (!speciesStats[sp]) {
      speciesStats[sp] = {
        species: sp,
        count: 0,
        biomassKg: 0,
        co2Kg: 0,
        canopySqM: 0,
        heights: [],
        traits,
      };
    }
    speciesStats[sp].count += 1;
    speciesStats[sp].biomassKg += biomassKg;
    speciesStats[sp].co2Kg += co2Kg;
    speciesStats[sp].canopySqM += canopyArea;
    speciesStats[sp].heights.push(height);

    // Maturity binning
    if (age < 50) maturityBins.young++;
    else if (age <= 120) maturityBins.maturing++;
    else if (age <= 200) maturityBins.mature++;
    else maturityBins.heritage++;

    return {
      id: String(tree.id || tree.treeId),
      species: sp,
      lat: Number(tree.lat),
      lng: Number(tree.lng),
      dbh: Math.round(dbh * 10) / 10,
      height: Math.round(height * 10) / 10,
      age,
      crownDiameter: Math.round(crownDiameter * 10) / 10,
      canopyArea: Math.round(canopyArea * 10) / 10,
      shadeArea: Math.round(shadeArea * 10) / 10,
      biomassKg,
      carbonKg,
      co2Kg,
      annualCo2Kg,
      dailyOxygenKg,
      rainwaterLiters,
      airPollutionKg,
      source: tree.source,
      impact: tree.impact || 'Normal',
      traits,
    };
  });

  const totalTrees = enrichedTrees.length;

  // 1. Canopy Covered
  // Effective canopy with natural overlap factor (~12%)
  const totalCanopyAreaSqM = Math.min(
    Math.round(areaSqM * 0.98),
    Math.round(totalRawCanopySqM * 0.88)
  );
  const canopyCoverPercent = parseFloat(
    Math.min(100, (totalCanopyAreaSqM / areaSqM) * 100).toFixed(1)
  );
  const totalShadeAreaSqM = Math.round(totalCanopyAreaSqM * 0.85);
  const shadedHectares = parseFloat((totalShadeAreaSqM / 10000).toFixed(3));
  const walkwayMeters = Math.round(totalShadeAreaSqM / 3.0); // 3m wide campus pathway
  const coolingDegrees =
    canopyCoverPercent >= 30 ? '3.5°C – 5.5°C' : canopyCoverPercent >= 15 ? '2.2°C – 3.8°C' : '1.2°C – 2.2°C';

  // 2. Most Occurring Tree (Dominant Species)
  const speciesList = Object.values(speciesStats).sort((a, b) => b.count - a.count);
  const dominantSpeciesData = speciesList[0];
  const mostOccurringTree = {
    species: dominantSpeciesData.species,
    count: dominantSpeciesData.count,
    percentage: parseFloat(((dominantSpeciesData.count / totalTrees) * 100).toFixed(1)),
    totalBiomassKg: dominantSpeciesData.biomassKg,
    totalCo2Kg: dominantSpeciesData.co2Kg,
    avgHeightM: parseFloat(
      (
        dominantSpeciesData.heights.reduce((a, b) => a + b, 0) /
        dominantSpeciesData.heights.length
      ).toFixed(1)
    ),
    category: dominantSpeciesData.traits.category,
    role: dominantSpeciesData.traits.role,
    campusSignificance: dominantSpeciesData.traits.campusSignificance,
    badge: 'Campus Forest Backbone',
  };

  // 3. Most Unique Tree in that Zone & Area
  // Find rarest species in this zone (smallest count)
  const rarestSpecies = [...speciesList].sort((a, b) => a.count - b.count)[0];
  // Candidate trees belonging to the rarest species
  const rarestTrees = enrichedTrees.filter((t) => t.species === rarestSpecies.species);
  // Pick candidate with highest age or carbon
  const uniqueSpecimen = rarestTrees.sort((a, b) => b.co2Kg - a.co2Kg)[0];

  const campusWideCount = allCampusSpeciesCounts[uniqueSpecimen.species] || rarestSpecies.count;
  const isOneOfOneInZone = rarestSpecies.count === 1;

  const mostUniqueTree = {
    id: uniqueSpecimen.id,
    species: uniqueSpecimen.species,
    lat: uniqueSpecimen.lat,
    lng: uniqueSpecimen.lng,
    countInZone: rarestSpecies.count,
    campusWideCount,
    rarityLabel: isOneOfOneInZone ? '1 of 1 Specimen in this Zone' : `Only ${rarestSpecies.count} in this Zone`,
    isOneOfOneInZone,
    age: uniqueSpecimen.age,
    height: uniqueSpecimen.height,
    dbh: uniqueSpecimen.dbh,
    crownDiameter: uniqueSpecimen.crownDiameter,
    canopyArea: uniqueSpecimen.canopyArea,
    co2Kg: uniqueSpecimen.co2Kg,
    dailyOxygenKg: uniqueSpecimen.dailyOxygenKg,
    category: uniqueSpecimen.traits.category,
    role: uniqueSpecimen.traits.role,
    botanicalSignificance: uniqueSpecimen.traits.campusSignificance,
    whyUnique: isOneOfOneInZone
      ? `This is the ONLY ${uniqueSpecimen.species} cataloged inside this entire zone (${campusWideCount} across all campus survey). A vital botanical seed bank and distinctive campus focal point.`
      : `With only ${rarestSpecies.count} recorded in this zone, this ${uniqueSpecimen.species} represents a rare biodiversity niche on campus.`,
  };

  // 4. Which Tree is Contributing Most (The Ecological Champion)
  const championTree = [...enrichedTrees].sort((a, b) => b.co2Kg - a.co2Kg)[0];
  const topContributingTree = {
    id: championTree.id,
    species: championTree.species,
    lat: championTree.lat,
    lng: championTree.lng,
    co2StoredKg: championTree.co2Kg,
    co2StoredTonnes: parseFloat((championTree.co2Kg / 1000).toFixed(2)),
    annualCo2Kg: championTree.annualCo2Kg,
    dailyOxygenKg: championTree.dailyOxygenKg,
    dailyBreathsProvided: Math.round(championTree.dailyOxygenKg / 0.84),
    canopyAreaSqM: championTree.canopyArea,
    crownDiameterM: championTree.crownDiameter,
    shadeAreaSqM: championTree.shadeArea,
    age: championTree.age,
    height: championTree.height,
    dbh: championTree.dbh,
    category: championTree.traits.category,
    contributionTitle: 'Zone Ecological Champion',
    story: `This individual ${championTree.species} holds ${championTree.co2Kg.toLocaleString()} kg of CO₂ in its living wood, produces enough pure oxygen for ${Math.round(
      championTree.dailyOxygenKg / 0.84
    )} adults every single day, and casts ${championTree.canopyArea} m² of shade over the campus floor.`,
  };

  // 5. Why Trees Matter on Campus (Plain-Language Educational Cards)
  const whyTreesMatter = [
    {
      id: 'cooling',
      title: 'Microclimate Cooling & Heat Island Shield',
      badge: `${coolingDegrees} Cooler`,
      color: 'amber',
      metric: `${totalShadeAreaSqM.toLocaleString()} m² shaded`,
      metricLabel: 'Natural Walking Corridor Shade',
      explanation: `Continuous tree crowns intercept harsh tropical sun, cooling ambient air by ${coolingDegrees} through natural evapotranspiration and keeping classroom walls from overheating.`,
      campusRelevance: `Equal to shading ${walkwayMeters.toLocaleString()} meters of pedestrian walkways between lecture halls and campus hostels.`,
    },
    {
      id: 'air_quality',
      title: 'Classroom Noise & Particulate Shield',
      badge: `${totalAirPollutionKg.toLocaleString()} kg/yr Filtered`,
      color: 'emerald',
      metric: `${Math.round(totalAirPollutionKg * 0.18)} kg PM2.5`,
      metricLabel: 'Fine Exhaust Dust Trapped',
      explanation: `Dense leaf foliage acts as an electrostatic sponge, capturing harmful vehicle exhaust, dust from nearby Saraswati Nagar road, and dampening ambient traffic decibels.`,
      campusRelevance: 'Creates a quieter acoustic buffer for library readers, auditorium sessions, and lab research.',
    },
    {
      id: 'water_sponge',
      title: 'Monsoon Sponge & Ground Water Recharge',
      badge: `${(totalRainwaterLiters / 1000).toFixed(0)}k Liters / Year`,
      color: 'blue',
      metric: `${totalRainwaterLiters.toLocaleString()} L`,
      metricLabel: 'Monsoon Rain Absorbed',
      explanation: `Tree root systems act as underground pipelines, channeling flash monsoon cloudbursts directly into the Nashik water table instead of flooding concrete quads.`,
      campusRelevance: 'Prevents quad waterlogging, eliminates standing water puddles, and recharges campus borewells naturally.',
    },
    {
      id: 'biodiversity',
      title: 'Living Educational Lab & Wildlife Haven',
      badge: `${speciesList.length} Native Species`,
      color: 'forest',
      metric: `${totalTrees} Trees`,
      metricLabel: 'Avian & Pollinator Habitats',
      explanation: `Home to local songbirds (Bulbuls, Mynas, Parakeets), squirrels, and native pollinators. Turns ordinary campus pathways into an interactive outdoor biology laboratory.`,
      campusRelevance: 'Enriches biodiversity studies for engineering, agricultural, and polytechnic students on-site.',
    },
    {
      id: 'mental_wellness',
      title: 'Student Cognitive Focus & Mental Wellness',
      badge: '21% Stress Drop',
      color: 'teal',
      metric: `${Math.round(totalDailyOxygenKg / 0.84)} Persons`,
      metricLabel: 'Daily Oxygen Provided',
      explanation: `Scientific research shows that just 20 minutes under mature campus tree shade reduces student cortisol (stress hormone) levels by 21%, restoring attention span before exams.`,
      campusRelevance: 'Provides restorative green gathering areas for group study, relaxation, and peaceful breaks between lectures.',
    },
  ];

  // 6. All-Tree Campus Ledger (Aggregates Across ALL Trees)
  const campusLedger = {
    totalTrees,
    totalBiomassTonnes: parseFloat((totalBiomassKg / 1000).toFixed(2)),
    totalCarbonTonnes: parseFloat((totalCarbonKg / 1000).toFixed(2)),
    totalCo2StoredTonnes: parseFloat((totalCo2StoredKg / 1000).toFixed(2)),
    totalCo2StoredKg,
    totalAnnualCo2Kg,
    totalDailyOxygenKg,
    totalPeopleOxygenSupplied: Math.round(totalDailyOxygenKg / 0.84),
    totalRainwaterInterceptionLiters: totalRainwaterLiters,
    totalAirPollutionRemovedKg: totalAirPollutionKg,
    totalCanopyAreaSqM,
    totalShadeAreaSqM,
    canopyCoverPercent,
    shadedHectares,
    walkwayEquivalentMeters: walkwayMeters,
    coolingDegrees,
    // Species leaderboard
    speciesLeaderboard: speciesList.map((s, idx) => ({
      rank: idx + 1,
      species: s.species,
      count: s.count,
      percentage: parseFloat(((s.count / totalTrees) * 100).toFixed(1)),
      totalCo2Kg: s.co2Kg,
      totalCanopySqM: Math.round(s.canopySqM),
      avgHeightM: parseFloat(
        (s.heights.reduce((a, b) => a + b, 0) / s.heights.length).toFixed(1)
      ),
      category: s.traits.category,
      role: s.traits.role,
    })),
    // Maturity profile
    maturityProfile: [
      {
        tier: 'Young & Growing (< 50 yrs)',
        count: maturityBins.young,
        percentage: parseFloat(((maturityBins.young / totalTrees) * 100).toFixed(1)),
        description: 'Rapid carbon absorption phase and future canopy replacement.',
      },
      {
        tier: 'Maturing Canopy (50 – 120 yrs)',
        count: maturityBins.maturing,
        percentage: parseFloat(((maturityBins.maturing / totalTrees) * 100).toFixed(1)),
        description: 'Prime ecological peak for shade, leaf biomass, and oxygen release.',
      },
      {
        tier: 'Mature Guardians (120 – 200 yrs)',
        count: maturityBins.mature,
        percentage: parseFloat(((maturityBins.mature / totalTrees) * 100).toFixed(1)),
        description: 'Deep carbon vaults with sprawling root networks and high biodiversity value.',
      },
      {
        tier: 'Heritage Veterans (> 200 yrs)',
        count: maturityBins.heritage,
        percentage: parseFloat(((maturityBins.heritage / totalTrees) * 100).toFixed(1)),
        description: 'Living historical monuments on campus providing maximum ecological stability.',
      },
    ],
  };

  return {
    hasTrees: true,
    canopyCovered: {
      totalCanopyAreaSqM,
      totalShadeAreaSqM,
      canopyCoverPercent,
      shadedHectares,
      walkwayMeters,
      coolingDegrees,
      plainLanguageSummary: `Living tree crowns cover ${canopyCoverPercent}% of this zone (${totalCanopyAreaSqM.toLocaleString()} m²), providing continuous cooling shade equivalent to ${walkwayMeters.toLocaleString()} meters of pedestrian walkways.`,
    },
    mostOccurringTree,
    mostUniqueTree,
    topContributingTree,
    whyTreesMatter,
    campusLedger,
  };
}

export default {
  computeCampusForestStory,
  getSpeciesTraits,
};

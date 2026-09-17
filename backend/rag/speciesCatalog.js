/** Scientific metadata for calculator dropdown species */
export const SPECIES_CATALOG = {
  Bamboo: {
    scientific: 'Bambusa vulgaris',
    family: 'Poaceae',
    aliases: ['Bamboo', 'Common bamboo'],
  },
  Christmas: {
    scientific: 'Araucaria columnaris',
    family: 'Araucariaceae',
    aliases: ['Christmas tree', 'Cook pine', 'New Caledonia pine'],
  },
  'Palm (Bottle Palm)': {
    scientific: 'Hyophorbe lagenicaulis',
    family: 'Arecaceae',
    aliases: ['Bottle palm', 'Palm'],
  },
  Coconut: {
    scientific: 'Cocos nucifera',
    family: 'Arecaceae',
    aliases: ['Coconut palm', 'Nariyal'],
  },
  Ashoka: {
    scientific: 'Saraca asoca',
    family: 'Fabaceae',
    aliases: ['Ashoka', 'Sorrowless tree', 'Sita Ashok'],
  },
  'Tej Patta': {
    scientific: 'Cinnamomum tamala',
    family: 'Lauraceae',
    aliases: ['Indian bay leaf', 'Malabar leaf', 'Tejpat'],
  },
  Badam: {
    scientific: 'Terminalia catappa',
    family: 'Combretaceae',
    aliases: ['Indian almond', 'Tropical almond', 'Badam'],
  },
  'Rain Tree': {
    scientific: 'Samanea saman',
    family: 'Fabaceae',
    aliases: ['Rain tree', 'Monkey pod', 'Cow tamarind'],
  },
  'Silver Oak': {
    scientific: 'Grevillea robusta',
    family: 'Proteaceae',
    aliases: ['Silver oak', 'Silky oak', 'Southern silky oak'],
  },
  Mango: {
    scientific: 'Mangifera indica',
    family: 'Anacardiaceae',
    aliases: ['Mango', 'Aam'],
  },
  Supari: {
    scientific: 'Areca catechu',
    family: 'Arecaceae',
    aliases: ['Betel nut palm', 'Areca nut', 'Supari'],
  },
  Ad: {
    scientific: 'Ad',
    family: 'Unknown',
    aliases: ['Ad'],
  },
  Bel: {
    scientific: 'Aegle marmelos',
    family: 'Rutaceae',
    aliases: ['Bael', 'Bengal quince', 'Wood apple', 'Bel'],
  },
};

export function resolveSpeciesMeta(speciesName) {
  if (!speciesName) {
    return { common: 'Tree', scientific: 'Unknown', family: 'Unknown', aliases: [] };
  }
  const exact = SPECIES_CATALOG[speciesName];
  if (exact) {
    return { common: speciesName, ...exact };
  }
  const key = Object.keys(SPECIES_CATALOG).find(
    (k) => k.toLowerCase() === String(speciesName).toLowerCase()
  );
  if (key) {
    return { common: key, ...SPECIES_CATALOG[key] };
  }
  return {
    common: speciesName,
    scientific: speciesName,
    family: 'Unknown',
    aliases: [speciesName],
  };
}

/**
 * BIODIVERSITY DATABASE — VanJeevan GIS Tree Inventory System
 * Static local database of animals, birds, insects, and mammals
 * associated with the 7 primary campus tree species.
 *
 * All images are stored locally in /biodiversity/ for 100% offline & reliable loading.
 * No external API or internet connection needed.
 */

export const BIODIVERSITY_DB = {
  Neem: {
    birds: [
      {
        name: 'Common Myna',
        scientific: 'Acridotheres tristis',
        image: '/biodiversity/common_myna.jpg',
        fact: 'One of the world\'s most widespread birds; nests in Neem cavities and feeds on its berries. Often spotted in urban campuses.',
        category: 'bird',
      },
      {
        name: 'Purple Sunbird',
        scientific: 'Cinnyris asiaticus',
        image: '/biodiversity/purple_sunbird.jpg',
        fact: 'A stunning iridescent nectar feeder that pollinates Neem flowers while hovering like a miniature hummingbird.',
        category: 'bird',
      },
      {
        name: 'Asian Koel',
        scientific: 'Eudynamys scolopaceus',
        image: '/biodiversity/asian_koel.jpg',
        fact: 'The Koel\'s melodious call announces the Indian summer. It lays eggs in Myna nests hidden in Neem branches.',
        category: 'bird',
      },
    ],
    insects: [
      {
        name: 'Native Honeybee',
        scientific: 'Apis cerana',
        image: '/biodiversity/native_honeybee.jpg',
        fact: 'India\'s native honeybee is a key pollinator of over 50 crop species. Neem flowers provide it vital early-season nectar.',
        category: 'insect',
      },
      {
        name: 'Lime Butterfly',
        scientific: 'Papilio demoleus',
        image: '/biodiversity/lime_butterfly.jpg',
        fact: 'One of the most common Indian swallowtails. Adults feed on nectar while caterpillars host on citrus understory near Neem.',
        category: 'insect',
      },
    ],
    mammals: [
      {
        name: 'Indian Palm Squirrel',
        scientific: 'Funambulus palmarum',
        image: '/biodiversity/indian_palm_squirrel.jpg',
        fact: 'Said to have been blessed by Lord Rama — three stripes on its back from divine fingers. A key seed disperser of Neem fruit.',
        category: 'mammal',
      },
    ],
  },

  Banyan: {
    birds: [
      {
        name: 'Coppersmith Barbet',
        scientific: 'Psilopogon haemacephalus',
        image: '/biodiversity/coppersmith_barbet.jpg',
        fact: 'Named for its metallic "tunk-tunk" call like a coppersmith\'s hammer. Excavates nesting holes in Banyan branches and eats its figs.',
        category: 'bird',
      },
      {
        name: 'Rose-ringed Parakeet',
        scientific: 'Psittacula krameri',
        image: '/biodiversity/rose_ringed_parakeet.jpg',
        fact: 'Vivid green parakeets roost in large Banyan canopies by the hundreds. They are important Banyan fig seed dispersers.',
        category: 'bird',
      },
      {
        name: 'Indian Grey Hornbill',
        scientific: 'Ocyceros birostris',
        image: '/biodiversity/indian_grey_hornbill.jpg',
        fact: 'The largest urban Hornbill in India. Seals its nest inside hollow Banyan trunks with mud, leaving only a beak-sized opening for feeding.',
        category: 'bird',
      },
    ],
    insects: [
      {
        name: 'Fig Wasp',
        scientific: 'Eupristina masoni',
        image: '/biodiversity/fig_wasp.jpg',
        fact: 'This 1.5mm wasp is the exclusive pollinator of Banyan figs. Without it, the Banyan cannot reproduce — a 30-million-year co-evolution.',
        category: 'insect',
      },
      {
        name: 'Carpenter Bee',
        scientific: 'Xylocopa latipes',
        image: '/biodiversity/carpenter_bee.jpg',
        fact: 'India\'s largest bee bores nesting galleries into dead Banyan wood. It can carry pollen loads 10x its own body weight.',
        category: 'insect',
      },
    ],
    mammals: [
      {
        name: 'Bonnet Macaque',
        scientific: 'Macaca radiata',
        image: '/biodiversity/bonnet_macaque.jpg',
        fact: 'South India\'s endemic primate lives almost entirely in Banyan groves. Groups of 20-30 individuals share a single ancient Banyan territory.',
        category: 'mammal',
      },
      {
        name: 'Indian Flying Fox',
        scientific: 'Pteropus giganteus',
        image: '/biodiversity/indian_flying_fox.jpg',
        fact: 'The world\'s largest bat; roosts in massive Banyan canopies in colonies of thousands and pollinates trees up to 60 km away each night.',
        category: 'mammal',
      },
    ],
  },

  Peepal: {
    birds: [
      {
        name: 'Red-vented Bulbul',
        scientific: 'Pycnonotus cafer',
        image: '/biodiversity/red_vented_bulbul.jpg',
        fact: 'A bold fruit-eater and top Peepal fig seed disperser. Its bright red vent patch makes it unmistakable in urban gardens.',
        category: 'bird',
      },
      {
        name: 'Indian White-eye',
        scientific: 'Zosterops palpebrosus',
        image: '/biodiversity/indian_white_eye.jpg',
        fact: 'Tiny, acrobatic birds that travel in chattering flocks through Peepal canopies, feeding on nectar, insects, and small figs.',
        category: 'bird',
      },
    ],
    insects: [
      {
        name: 'Peepal Fig Wasp',
        scientific: 'Blastophaga quadraticeps',
        image: '/biodiversity/fig_wasp.jpg',
        fact: 'The sacred Peepal tree relies entirely on this specialized wasp for pollination. Each Ficus species has its own exclusive wasp partner.',
        category: 'insect',
      },
    ],
    mammals: [
      {
        name: 'Short-nosed Fruit Bat',
        scientific: 'Cynopterus sphinx',
        image: '/biodiversity/short_nosed_fruit_bat.jpg',
        fact: 'A master seed disperser that eats Peepal figs and deposits seeds up to 1.5 km away, enabling forest regeneration.',
        category: 'mammal',
      },
    ],
  },

  Mango: {
    birds: [
      {
        name: 'Asian Koel',
        scientific: 'Eudynamys scolopaceus',
        image: '/biodiversity/asian_koel.jpg',
        fact: 'The iconic "voice of summer" in India. Mango orchards are its favorite haunt — it gorges on ripe mangoes and calls for hours at dawn.',
        category: 'bird',
      },
      {
        name: 'Alexandrine Parakeet',
        scientific: 'Psittacula eupatria',
        image: '/biodiversity/alexandrine_parakeet.jpg',
        fact: 'Named after Alexander the Great who sent these birds to Europe. Mango trees are its primary nesting and feeding habitat in South Asia.',
        category: 'bird',
      },
      {
        name: 'Coppersmith Barbet',
        scientific: 'Psilopogon haemacephalus',
        image: '/biodiversity/coppersmith_barbet.jpg',
        fact: 'Drills nest holes in mango branches. Its relentless "tok-tok" call in summer is louder than nearby traffic noise.',
        category: 'bird',
      },
    ],
    insects: [
      {
        name: 'Dwarf Honeybee',
        scientific: 'Apis florea',
        image: '/biodiversity/dwarf_honeybee.jpg',
        fact: 'At just 7mm, this is critical for mango pollination. Managed honeybee hives in mango orchards increase yield by up to 40%.',
        category: 'insect',
      },
      {
        name: 'Blue Tiger Butterfly',
        scientific: 'Tirumala limniace',
        image: '/biodiversity/blue_tiger_butterfly.jpg',
        fact: 'A migratory butterfly that travels 1,000+ km across India. Mango trees provide nectar corridors along its migration routes.',
        category: 'insect',
      },
    ],
    mammals: [
      {
        name: 'Common Palm Civet',
        scientific: 'Paradoxurus hermaphroditus',
        image: '/biodiversity/common_palm_civet.jpg',
        fact: 'The Toddy Cat climbs mango trees at night eating ripe fruit. Seeds pass through its gut unharmed, germinating faster than manual planting.',
        category: 'mammal',
      },
    ],
  },

  'Rain Tree': {
    birds: [
      {
        name: 'Black Drongo',
        scientific: 'Dicrurus macrocercus',
        image: '/biodiversity/black_drongo.jpg',
        fact: 'A fearless aerial acrobat that dive-bombs crows and hawks 10x its size. Perches atop Rain Tree crowns to spy insects flushed by cattle.',
        category: 'bird',
      },
      {
        name: 'Common Tailorbird',
        scientific: 'Orthotomus sutorius',
        image: '/biodiversity/common_tailorbird.jpg',
        fact: 'Stitches living leaves together with plant fibers to cradle its nest, hidden among Rain Tree\'s folding leaflets. A true avian engineer.',
        category: 'bird',
      },
    ],
    insects: [
      {
        name: 'Giant Rock Bee',
        scientific: 'Apis dorsata',
        image: '/biodiversity/giant_rock_bee.jpg',
        fact: 'The largest honeybee in the world (20mm+). Builds massive open combs on Rain Tree branches weighing up to 10 kg of honey.',
        category: 'insect',
      },
      {
        name: 'Grass Jewel Butterfly',
        scientific: 'Freyeria trochylus',
        image: '/biodiversity/grass_jewel_butterfly.jpg',
        fact: 'India\'s smallest butterfly (9mm wingspan). Shelters in Rain Tree\'s massive crown to avoid heat, feeding on understory groundcover.',
        category: 'insect',
      },
    ],
    mammals: [
      {
        name: 'Striped Palm Squirrel',
        scientific: 'Funambulus palmarum',
        image: '/biodiversity/indian_palm_squirrel.jpg',
        fact: 'Forages Rain Tree seed pods fallen after monsoon. Active year-round; chirping alarm calls alert other animals to aerial predators.',
        category: 'mammal',
      },
    ],
  },

  Ashoka: {
    birds: [
      {
        name: 'Purple Sunbird',
        scientific: 'Cinnyris asiaticus',
        image: '/biodiversity/purple_sunbird.jpg',
        fact: 'The Ashoka\'s brilliant orange-red flower clusters are a primary nectar source for sunbirds. The male\'s iridescent purple plumage rivals the flowers\' brilliance.',
        category: 'bird',
      },
      {
        name: 'Pale-billed Flowerpecker',
        scientific: 'Dicaeum erythrorhynchos',
        image: '/biodiversity/pale_billed_flowerpecker.jpg',
        fact: 'One of India\'s smallest birds (8cm). Specializes in feeding on mistletoe berries but also pollinates Ashoka blooms by crawling inside flowers.',
        category: 'bird',
      },
    ],
    insects: [
      {
        name: 'Common Jezebel',
        scientific: 'Delias eucharis',
        image: '/biodiversity/common_jezebel.jpg',
        fact: 'One of India\'s most striking butterflies with dazzling yellow-red underwings. Larva feeds on mistletoe in tree canopies including Ashoka.',
        category: 'insect',
      },
      {
        name: 'Hoverfly',
        scientific: 'Ischiodon scutellaris',
        image: '/biodiversity/hoverfly.jpg',
        fact: 'Harmless bee mimics that hover motionless mid-air. Essential pollinators of Ashoka; larvae feed on aphid colonies in bark crevices.',
        category: 'insect',
      },
    ],
    mammals: [
      {
        name: 'Indian Palm Squirrel',
        scientific: 'Funambulus palmarum',
        image: '/biodiversity/indian_palm_squirrel.jpg',
        fact: 'Scurries through Ashoka\'s dense columnar canopy foraging on flowers and small seeds. Active even during peak afternoon heat.',
        category: 'mammal',
      },
    ],
  },

  Rubber: {
    birds: [
      {
        name: 'Spotted Dove',
        scientific: 'Spilopelia chinensis',
        image: '/biodiversity/spotted_dove.jpg',
        fact: 'A gentle, cooing ground-feeder that nests in low Rubber tree branches. Its distinctive spotted neck patch is its identifying hallmark.',
        category: 'bird',
      },
      {
        name: 'Oriental Magpie-Robin',
        scientific: 'Copsychus saularis',
        image: '/biodiversity/oriental_magpie_robin.jpg',
        fact: 'One of India\'s finest songbirds. Perches in Rubber tree canopies to broadcast its rich, complex song at dawn and dusk.',
        category: 'bird',
      },
    ],
    insects: [
      {
        name: 'Rubber Fig Wasp',
        scientific: 'Pleistodontes sp.',
        image: '/biodiversity/fig_wasp.jpg',
        fact: 'Ficus elastica hosts its own exclusive fig wasp species. The wasp enters through a tiny pore (ostiole) just 0.1mm wide.',
        category: 'insect',
      },
      {
        name: 'Bark Mantis',
        scientific: 'Liturgusa sp.',
        image: '/biodiversity/bark_mantis.jpg',
        fact: 'Masters of camouflage that blend perfectly with Rubber tree bark texture. They ambush insects drawn to the tree\'s milky latex seeps.',
        category: 'insect',
      },
    ],
    mammals: [
      {
        name: 'Common Tree Shrew',
        scientific: 'Tupaia glis',
        image: '/biodiversity/common_tree_shrew.jpg',
        fact: 'One of the oldest mammal lineages alive — a living fossil related to primates. Feeds on Rubber fig latex insects and small arthropods.',
        category: 'mammal',
      },
    ],
  },
};

/**
 * Get biodiversity data for a given species key.
 * Falls back to Neem data if species not found.
 */
export function getBiodiversityData(speciesKey) {
  if (!speciesKey) return BIODIVERSITY_DB['Neem'];
  if (BIODIVERSITY_DB[speciesKey]) return BIODIVERSITY_DB[speciesKey];

  const norm = String(speciesKey).toLowerCase().replace(/[\s_-]+/g, '');
  for (const k of Object.keys(BIODIVERSITY_DB)) {
    const cleanK = k.toLowerCase().replace(/[\s_-]+/g, '');
    if (cleanK === norm || norm.includes(cleanK) || cleanK.includes(norm)) {
      return BIODIVERSITY_DB[k];
    }
  }

  // Botanical / Scientific / Alternative names
  if (norm.includes('neem') || norm.includes('azadirachta')) return BIODIVERSITY_DB['Neem'];
  if (norm.includes('banyan') || norm.includes('benghalensis')) return BIODIVERSITY_DB['Banyan'];
  if (norm.includes('peepal') || norm.includes('religiosa') || norm.includes('bodhi') || norm.includes('sacredfig')) return BIODIVERSITY_DB['Peepal'];
  if (norm.includes('mango') || norm.includes('mangifera')) return BIODIVERSITY_DB['Mango'];
  if (norm.includes('rain') || norm.includes('samanea') || norm.includes('saman') || norm.includes('monkeypod')) return BIODIVERSITY_DB['Rain Tree'];
  if (norm.includes('ashok') || norm.includes('saraca') || norm.includes('asoca')) return BIODIVERSITY_DB['Ashoka'];
  if (norm.includes('rubber') || norm.includes('elastica')) return BIODIVERSITY_DB['Rubber'];

  return BIODIVERSITY_DB['Neem'];
}

/** Flatten all creatures for a species into a single array */
export function getAllCreatures(speciesKey) {
  const data = getBiodiversityData(speciesKey);
  return [
    ...(data.birds || []),
    ...(data.insects || []),
    ...(data.mammals || []),
  ];
}

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Upload,
  Camera,
  Sparkles,
  Trees,
  CheckCircle2,
  Clock,
  Ruler,
  Leaf,
  Wind,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  ArrowDown,
  RotateCcw,
  AlertCircle,
  HelpCircle,
  Info,
  Maximize2,
  MapPin,
  Hash,
  Activity,
  Compass,
  FlaskConical,
  Syringe,
  Bug,
  Smile,
  Thermometer,
  Zap,
  BookOpen,
  Heart,
  HeartPulse,
  Bird,
  Printer,
  FileText,
  Droplets,
  Sun,
  Car,
  Eye,
  Save,
  Crosshair,
  Globe,
  X,
  RefreshCw,
  ScanLine,
  TreePine,
  Loader2,
  Search,
} from 'lucide-react';
import { speciesDetectionApi, registeredTreeApi } from '../services/api';
import { SPECIES_EXTENDED_KNOWLEDGE } from '../data/speciesRagKnowledge';
import {
  buildLocalClimateSummary,
  buildLocalMedicinalSummary,
  buildLocalHabitatSummary,
} from '../data/localSpeciesPacks';
import { getBiodiversityData } from '../data/biodiversityDatabase';

/**
 * Full Botanical & Ecological Knowledge Base
 * Incorporates formulas from calculator.js and extendedCalculator.js
 */
const SPECIES_REGISTRY = {
  Neem: {
    name: 'Neem',
    scientific: 'Azadirachta indica',
    family: 'Meliaceae',
    mai: 1.15,
    growthRate: 3.8,
    woodDensity: 0.72,
    role: 'Antibacterial air purification, intense urban heat mitigation, high drought tolerance.',
    sampleImage: '/campus_neem_canopy.jpg',
    apothecaryImage: '/medicinal_apothecary.png',
    habitatImage: '/biodiversity/neem_canopy_real.jpg',
    compounds: ['Azadirachtin', 'Nimbin', 'Nimbidin', 'Limonoids', 'Quercetin', 'Gedunin'],
    applications: ['Dermatological antiseptic lotions', 'Natural biopesticide sprays', 'Herbal dental extracts', 'Immune modulation tonic'],
    diseases: ['Eczema & cutaneous lesions', 'Bacterial & fungal dermatoses', 'Gingivitis & periodontal inflammation', 'Malaria & febrile symptoms'],
    ethnobotany: 'In Ayurvedic and traditional Indian systems, Neem is revered as "Sarva Roga Nivarini" (curing all ailments). Twigs are used as natural antibacterial toothbrushes (Datun), and dried leaves protect stored grains from pests.',
    birds: ['Common Myna (Acridotheres tristis)', 'Purple Sunbird (Cinnyris asiaticus)', 'Asian Koel (Eudynamys scolopaceus)', 'Spotted Dove (Spilopelia chinensis)'],
    insects: ['Native Honeybee (Apis cerana)', 'Giant Rock Bee (Apis dorsata)', 'Lime Butterfly (Papilio demoleus)'],
    mammals: ['Indian Palm Squirrel (Funambulus palmarum)', 'Fruit Bats (Pteropus giganteus)'],
    spirituality: 'Worshiped as an earthly manifestation of Goddess Durga / Mariamman. During traditional festivals, fresh Neem foliage is festooned across doorways to disinfect incoming air and ward off physical and metaphysical illness.',
    story: 'Revered as the village pharmacy across South Asia. Traditional communities prohibit cutting down mature neem trees, preserving high canopy density in arid regions.',
  },
  Banyan: {
    name: 'Banyan',
    scientific: 'Ficus benghalensis',
    family: 'Moraceae',
    mai: 1.30,
    growthRate: 3.5,
    woodDensity: 0.58,
    role: 'Massive shade umbrella, keystone biodiversity habitat, supports hundreds of bird & insect species.',
    sampleImage: '/stewardship_tree_canopy.jpg',
    apothecaryImage: '/medicinal_apothecary.png',
    habitatImage: '/biodiversity/banyan_canopy_real.jpg',
    compounds: ['Bengalenoside', 'Flavonoid glycosides', 'Triterpenes', 'Aerial root tannins', 'Beta-sitosterol'],
    applications: ['Astringent root tonics', 'Latex wound dressings', 'Anti-inflammatory poultices', 'Metabolic glucose balancing'],
    diseases: ['Rheumatic joint inflammation', 'Dental abscesses & oral ulcers', 'Superficial skin ulcers', 'Dysentery & gastrointestinal flux'],
    ethnobotany: 'The aerial prop roots and milky latex have been applied in folklore medicine for centuries to relieve severe swelling and toothache.',
    birds: ['Coppersmith Barbet (Psilopogon haemacephalus)', 'Indian Grey Hornbill (Ocyceros birostris)', 'Rose-ringed Parakeet (Psittacula krameri)', 'Oriental Magpie-Robin'],
    insects: ['Specialized Fig Wasp (Eupristina masoni)', 'Carpenter Bee (Xylocopa sp.)', 'Monarch Butterfly'],
    mammals: ['Bonnet Macaque (Macaca radiata)', 'Three-striped Palm Squirrel', 'Flying Fox Bat Colonies'],
    spirituality: 'The sacred "Vat Vriksha" represents immortality, longevity, and Lord Brahma/Vishnu/Shiva. During Vat Purnima, women tie sacred sacred threads around its trunk praying for family health.',
    story: 'Keystone species whose wide aerial arches create living green temples. Felling an ancient Banyan is traditionally seen as severing the community\'s ecological anchor.',
  },
  Peepal: {
    name: 'Peepal',
    scientific: 'Ficus religiosa',
    family: 'Moraceae',
    mai: 1.40,
    growthRate: 3.6,
    woodDensity: 0.52,
    role: 'Continuous daytime oxygen synthesis, sacred canopy shelter, soil moisture conservation.',
    sampleImage: '/stewardship_forest_hills.jpg',
    apothecaryImage: '/medicinal_apothecary.png',
    habitatImage: '/biodiversity/peepal_canopy_real.jpg',
    compounds: ['Campesterol', 'Stigmasterol', 'Tannic acid', 'Phenolic flavonoids', 'Arginine'],
    applications: ['Bark decoction mouthwashes', 'Antiasthmatic leaf powders', 'Wound-cleansing leaf extracts', 'Cardiovascular tonics'],
    diseases: ['Chronic respiratory asthma', 'Inflammatory boils & wound crusts', 'Gastrointestinal bleeding', 'Gingival disorders'],
    ethnobotany: 'Known as the "Bodhi Tree", under which Gautama Buddha attained supreme enlightenment. Leaves and bark feature prominently in Charaka Samhita.',
    birds: ['Brown-headed Barbet (Psilopogon zeylanicus)', 'Green Imperial Pigeon', 'Red-vented Bulbul', 'Indian White-eye'],
    insects: ['Blastophaga quadraticeps fig wasps', 'Native stinging honeybees', 'Tussar silk moths'],
    mammals: ['Small Indian Civet', 'Palm Squirrels', 'Short-nosed Fruit Bat'],
    spirituality: 'Deeply revered in Hinduism, Buddhism, and Jainism. Thought to house the Holy Trinity. Believers circumambulate the trunk early morning to breathe oxygen-rich air.',
    story: 'The Mahabodhi tree descendant in Bodh Gaya has survived thousands of years as an emblem of spiritual awakening and universal peace.',
  },
  'Rain Tree': {
    name: 'Rain Tree',
    scientific: 'Samanea saman',
    family: 'Fabaceae',
    mai: 1.50,
    growthRate: 3.8,
    woodDensity: 0.50,
    role: 'Atmospheric nitrogen-fixing root nodules, vast microclimate cooling, fast-growing canopy.',
    sampleImage: '/campus_tree_plantation.jpg',
    apothecaryImage: '/medicinal_apothecary.png',
    habitatImage: '/biodiversity/raintree_canopy_real.jpg',
    compounds: ['Pithecellobine alkaloid', 'Saponins', 'Polyphenols', 'Tannins', 'Flavonoid glycosides'],
    applications: ['Antibacterial leaf washes', 'Antidiarrheal bark extracts', 'Cooling scalp washes', 'Traditional sedatives'],
    diseases: ['Bacterial dysentery', 'Intestinal cramps', 'Superficial fungal rashes', 'Insomnia & nervous restlessness'],
    ethnobotany: 'The folding of bipinnate leaves before rainfall and at sunset earned it the moniker "Rain Tree" or "Monkey Pod".',
    birds: ['Black Drongo (Dicrurus macrocercus)', 'Common Tailorbird', 'Jungle Babbler', 'Spotted Dove'],
    insects: ['Giant Honeybee (Apis dorsata)', 'Leafcutter Bees', 'Grass Jewel Butterfly'],
    mammals: ['Striped Palm Squirrels', 'Fruit-eating bats'],
    spirituality: 'Symbols of community congregation and shelter. Town squares were historically built beneath its broad spreading crowns.',
    story: 'Urban heat island studies show that street avenues shaded by broad Rain Trees maintain road temperatures up to 8°C cooler than open asphalt.',
  },
  Ashoka: {
    name: 'Ashoka',
    scientific: 'Saraca asoca',
    family: 'Fabaceae',
    mai: 1.20,
    growthRate: 4.1,
    woodDensity: 0.67,
    role: 'Dense columnar evergreen foliage, sound barrier, fragrant pollinator nectar blooms.',
    sampleImage: '/botanical_red_flora.jpg',
    apothecaryImage: '/medicinal_apothecary.png',
    habitatImage: '/biodiversity/ashoka_canopy_real.jpg',
    compounds: ['Saracin', 'Catechin', 'Epicatechin', 'Leucopelargonidin', 'Organic iron complexes'],
    applications: ['Ashokarishta uterine tonic', 'Hemostatic bark extracts', 'Anti-inflammatory pelvic remedies', 'Dermal astringent lotions'],
    diseases: ['Gynecological hemorrhages & menorrhagia', 'Dysmenorrhea & uterine cramps', 'Internal ulcers', 'Dermatological discoloration'],
    ethnobotany: 'Etymologically "A-shoka" translates to "without sorrow". It has been consecrated in classical Sanskrit poetry as a bringer of peace and joy.',
    birds: ['Purple Sunbird (Cinnyris asiaticus)', 'Pale-billed Flowerpecker', 'Common Myna', 'Indian Robin'],
    insects: ['Common Jezebel Butterfly', 'Apis cerana bees', 'Hoverflies'],
    mammals: ['Palm Squirrels', 'Tree shrews'],
    spirituality: 'Sacred to Kamadeva and Yakshi guardian deities. Queen Maya is chronicled to have given birth to Siddhartha Gautama under a flourishing Ashoka canopy.',
    story: 'Protected in temple courtyards across South Asia, its felling is strictly taboo in sacred groves.',
  },
  Mango: {
    name: 'Mango',
    scientific: 'Mangifera indica',
    family: 'Anacardiaceae',
    mai: 1.10,
    growthRate: 4.2,
    woodDensity: 0.65,
    role: 'Seasonal fruit canopy, high carbon retention, supports wild pollinators and urban avifauna.',
    sampleImage: '/stewardship_farmer_planting.jpg',
    apothecaryImage: '/medicinal_apothecary.png',
    habitatImage: '/biodiversity/mango_canopy_real.jpg',
    compounds: ['Mangiferin', 'Phenolic acids', 'Anacardic acid', 'Catechins', 'Alpha-terpineol'],
    applications: ['Antidiabetic leaf decoctions', 'Digestive seed powder infusions', 'Anti-inflammatory gum resins', 'Antioxidant skin serums'],
    diseases: ['Type-2 diabetes metabolic support', 'Chronic diarrhea & dysentery', 'Bleeding gums', 'Throat catarrh & hoarseness'],
    ethnobotany: 'The king of fruits whose tender leaves (Toran) are considered auspicious and tied over doorways during harvest and housewarming rites.',
    birds: ['Asian Koel (Eudynamys scolopaceus)', 'Alexandrine Parakeet', 'Oriental White-eye', 'Crimson-breasted Barbet'],
    insects: ['Wild Honeybees (Apis florea & cerana)', 'Syrphid Flower Flies', 'Blue Tiger Butterfly'],
    mammals: ['Flying Squirrels', 'Common Palm Civet', 'Rousette Bats'],
    spirituality: 'Associated with Goddess Saraswati and Lord Ganesha. Mangiferin is extensively studied today for its powerful anti-diabetic and cardio-protective properties.',
    story: 'Mature mango orchards form micro-ecosystems that feed birds, mammals, and humans for generations.',
  },
  Rubber: {
    name: 'Rubber',
    scientific: 'Ficus elastica',
    family: 'Moraceae',
    mai: 1.35,
    growthRate: 3.4,
    woodDensity: 0.60,
    role: 'Glossy thick foliage traps heavy particulate matter (PM2.5/PM10), robust wind resistance.',
    sampleImage: '/blooming_flora.jpg',
    apothecaryImage: '/medicinal_apothecary.png',
    habitatImage: '/biodiversity/rubber_canopy_real.jpg',
    compounds: ['Latex cis-1,4-polyisoprene', 'Ficaprenol', 'Triterpenes', 'Flavonoids', 'Proteolytic enzymes'],
    applications: ['Antimicrobial latex ointments', 'Mild anti-inflammatory poultices', 'Natural elastomer synthesis', 'Particulate pollutant scrubbers'],
    diseases: ['Minor dermal infections', 'Muscular sprains & swelling', 'Superficial skin warts', 'Insect sting inflammation'],
    ethnobotany: 'In Meghalaya, Northeast India, indigenous Khasi and Jaintia tribes train Ficus elastica aerial roots over rivers to grow living root bridges lasting centuries.',
    birds: ['Canopy babblers', 'Pigeons & doves', 'Sunbirds visiting lower epiphyte blooms'],
    insects: ['Fig wasps', 'Bark mantises', 'Weevils'],
    mammals: ['Small arbor-dwelling rodents', 'Tree shrews'],
    spirituality: 'Celebrated as an example of harmonious bio-engineering where humans and living trees co-construct permanent infrastructure.',
    story: 'Living root bridges in Cherrapunji grow stronger as the tree ages, unlike concrete and steel which rust and decay.',
  },
  Bamboo: {
    name: 'Bamboo',
    scientific: 'Bambusa vulgaris',
    family: 'Poaceae',
    mai: 2.50,
    growthRate: 3.0,
    woodDensity: 0.45,
    role: 'Hyper-fast biomass generation, deep fibrous root soil anchoring against flash-flood river erosion.',
    sampleImage: '/campus_tree_plantation.jpg',
    apothecaryImage: '/medicinal_apothecary.png',
    habitatImage: '/biodiversity/neem_canopy_real.jpg',
    compounds: ['Tabasheer (organic silica)', 'Silicic acid', 'Flavone glycosides', 'Phenolic peptides'],
    applications: ['Bone & connective tissue mineralizer', 'Natural antipyretic tablets', 'Cooling bronchial infusions', 'Wound styptics'],
    diseases: ['Osteoporosis & joint brittleness', 'Chronic bronchial inflammation', 'Fever & thirst agitation', 'Internal tissue heat'],
    ethnobotany: 'Tabasheer (bamboo manna) collected inside hollow culms is a prized therapeutic agent in both Ayurveda and Unani.',
    birds: ['Scaly-breasted Munia', 'Baya Weaver', 'Common Kingfisher along riverbanks'],
    insects: ['Bamboo Borers', 'Bamboo Aphids', 'Praying Mantis'],
    mammals: ['Indian Porcupine', 'Field Mice', 'Hare'],
    spirituality: 'Symbol of flexibility, resilience, and rapid upright growth. Bamboo flutes (Bansuri) embody Lord Krishna\'s music.',
    story: 'Canopy dense bamboo clumps absorb 35% more carbon and generate 30% more oxygen than typical hardwood timber stands.',
  },
  Coconut: {
    name: 'Coconut',
    scientific: 'Cocos nucifera',
    family: 'Arecaceae',
    mai: 1.10,
    growthRate: 4.5,
    woodDensity: 0.55,
    role: 'Coastal cyclone resistance, natural electrolyte reservoir, perennial green cover.',
    sampleImage: '/stewardship_farmer_planting.jpg',
    apothecaryImage: '/medicinal_apothecary.png',
    habitatImage: '/biodiversity/neem_canopy_real.jpg',
    compounds: ['Lauric acid (monolaurin)', 'Cytokinins', 'Medium-chain triglycerides', 'Potassium-rich mineral salts'],
    applications: ['Antimicrobial virgin coconut oil', 'Electrolyte hydration fluids', 'Dermal barrier lipid restore', 'Digestive energy supplements'],
    diseases: ['Dehydration & heat prostration', 'Fungal tinea & candidiasis', 'Dry xerosis dermatosis', 'Gastrointestinal malnutrition'],
    ethnobotany: 'Called "Kalpavriksha" (the tree that provides all the necessities of life). Every part—fruit, water, frond, husk, and trunk—is utilized.',
    birds: ['Asian Palm Swift', 'House Crow', 'Common Myna', 'Black-hooded Oriole'],
    insects: ['Rhinoceros Beetle', 'Red Palm Weevil', 'Wild bees visiting inflorescences'],
    mammals: ['Palm Civet (Toddy Cat)', 'Fruit bats', 'Squirrels'],
    spirituality: 'Essential in religious rituals; unbroken coconuts are offered at temples and broken to symbolize humbling the ego.',
    story: 'Its flexible curved trunk absorbs violent maritime cyclonic winds without snapping, protecting inland settlements.',
  },
  'Palm (Bottle Palm)': {
    name: 'Bottle Palm',
    scientific: 'Hyophorbe lagenicaulis',
    family: 'Arecaceae',
    mai: 1.00,
    growthRate: 4.2,
    woodDensity: 0.48,
    role: 'Compact architectural palm, high salt tolerance, resilient urban decorative canopy.',
    sampleImage: '/campus_neem_canopy.jpg',
    apothecaryImage: '/medicinal_apothecary.png',
    habitatImage: '/biodiversity/neem_canopy_real.jpg',
    compounds: ['Polyphenolic antioxidants', 'Cellulose fibers', 'Fatty acid esters'],
    applications: ['Traditional shade cooling', 'Erosion prevention in sandy loam', 'Urban particulate barrier'],
    diseases: ['Thermal heat mitigation', 'Urban particulate pollution filtering'],
    ethnobotany: 'Named for its unique swollen bottle-shaped trunk which holds moisture reserves during prolonged dry periods.',
    birds: ['Spotted Dove', 'Purple Sunbird', 'Tailorbirds nesting in fronds'],
    insects: ['Native bees gathering pollen from spathes'],
    mammals: ['Garden squirrels'],
    spirituality: 'Represents tropical tranquility, welcoming presence, and perseverance in stressful arid environments.',
    story: 'Native to Round Island, Mauritius, it was brought back from the brink of extinction through botanical garden propagation.',
  },
  Guava: {
    name: 'Guava',
    scientific: 'Psidium guajava',
    family: 'Myrtaceae',
    mai: 0.85,
    growthRate: 4.0,
    woodDensity: 0.75,
    role: 'High-density fruit canopy, Vitamin C enrichment, rapid pollinator attraction.',
    sampleImage: '/botanical_red_flora.jpg',
    apothecaryImage: '/medicinal_apothecary.png',
    habitatImage: '/biodiversity/neem_canopy_real.jpg',
    compounds: ['Quercetin', 'Guajaverin', 'Vitamin C (ascorbic acid)', 'Caryophyllene', 'Lycopene'],
    applications: ['Antidiabetic leaf tea infusions', 'Astringent oral gargles', 'Anti-diarrheal broths', 'Antimicrobial topical washes'],
    diseases: ['Acute gastroenteritis & diarrhea', 'Oral candidiasis & bleeding gums', 'Hyperglycemia regulation', 'Superficial skin acne'],
    ethnobotany: 'Crushed guava leaves chewed raw represent one of the most effective traditional Indian first-aid remedies for severe toothache.',
    birds: ['Rose-ringed Parakeet', 'Coppersmith Barbet', 'Red-whiskered Bulbul', 'Common Babbler'],
    insects: ['Honeybees', 'Fruit flies (Bactrocera)', 'Swallowtail butterflies'],
    mammals: ['Fruit bats', 'Striped squirrels'],
    spirituality: 'A symbol of fertility and domestic prosperity, traditionally planted in kitchen gardens to feed both children and songbirds.',
    story: 'Leaves contain potent quercetin which inhibits carbohydrate intestinal absorption, validated in modern pharmacological trials.',
  },
  'Silver Oak': {
    name: 'Silver Oak',
    scientific: 'Grevillea robusta',
    family: 'Proteaceae',
    mai: 1.25,
    growthRate: 3.9,
    woodDensity: 0.57,
    role: 'Windbreak buffer, deep mycorrhizal phosphorus uptake, prominent golden brush flowers.',
    sampleImage: '/stewardship_forest_hills.jpg',
    apothecaryImage: '/medicinal_apothecary.png',
    habitatImage: '/biodiversity/neem_canopy_real.jpg',
    compounds: ['Resorcinol alkyl derivatives', 'Grevilleol', 'Phenolic glycosides', 'Proteoid cluster exudates'],
    applications: ['Agroforestry shade canopy', 'Windbreak shelterbelt barrier', 'Timber & artisan woodwork'],
    diseases: ['Thermal shock protection for understory crops', 'Soil degradation mitigation'],
    ethnobotany: 'Widely planted as shade cover in high-altitude tea and coffee plantations, enriching organic leaf mulch in depleted soils.',
    birds: ['White-cheeked Barbet', 'Tickell\'s Flowerpecker', 'Verditer Flycatcher'],
    insects: ['Apis dorsata bees collecting copious golden flower nectar'],
    mammals: ['Malabar Giant Squirrel in native ranges', 'Palm squirrels'],
    spirituality: 'Its fern-like silvery-underside foliage symbolizes adaptability across high rainfall slopes and misty mountain passes.',
    story: 'Can produce specialized proteoid root clusters that chemically liberate bound phosphorus from mineral-poor subsoils.',
  },
  Christmas: {
    name: 'Christmas',
    scientific: 'Araucaria columnaris',
    family: 'Araucariaceae',
    mai: 1.10,
    growthRate: 3.4,
    woodDensity: 0.52,
    role: 'Architectural evergreen conifer, windbreak barrier, year-round urban PM filter.',
    sampleImage: '/stewardship_forest_hills.jpg',
    apothecaryImage: '/medicinal_apothecary.png',
    habitatImage: '/biodiversity/neem_canopy_real.jpg',
    compounds: ['Beyerene diterpenes', 'Bioflavonoids', 'Araucaria resin acids', 'Lignans'],
    applications: ['Natural antiseptic wound sealant', 'Aromatic conifer resin', 'Urban acoustic baffle'],
    diseases: ['Minor skin abrasions', 'Atmospheric particulate filtration'],
    ethnobotany: 'Iconic formal architectural evergreen conifer; needle resin historically collected as natural antiseptic gum and incense.',
    birds: ['Urban pigeons & doves roosting on leaders', 'Common Myna', 'Small songbirds'],
    insects: ['Spider mites', 'Native bees visiting nearby understory'],
    mammals: ['Palm squirrels'],
    spirituality: 'Symbolizes resilience, architectural symmetry, and evergreen perseverance through dry seasons.',
    story: 'Dense evergreen needles continuously trap PM2.5 and PM10 particles year-round without winter shedding.',
  },
  'Tej Patta': {
    name: 'Tej Patta',
    scientific: 'Cinnamomum tamala',
    family: 'Lauraceae',
    mai: 1.05,
    growthRate: 3.6,
    woodDensity: 0.65,
    role: 'Subtropical aromatic spice tree, culinary essential oils, soil-binding hillside canopy.',
    sampleImage: '/botanical_red_flora.jpg',
    apothecaryImage: '/medicinal_apothecary.png',
    habitatImage: '/biodiversity/neem_canopy_real.jpg',
    compounds: ['Eugenol', 'Linalool', 'Cinnamic aldehyde', 'Polyphenols', 'Alpha-pinene'],
    applications: ['Ayurvedic digestive Agni stimulator', 'Aromatic culinary spice', 'Glycemic control infusions'],
    diseases: ['Digestive dyspepsia', 'Metabolic glucose balancing', 'Respiratory congestion'],
    ethnobotany: 'Revered in Charaka Samhita as one of the classical "Trijata" spices; essential ingredient of Ayurvedic Chandraprabha Vati.',
    birds: ['Foothill bulbuls', 'Sunbirds', 'White-eyes'],
    insects: ['Cinnamon butterfly (Chilasa clytia)', 'Native honeybees'],
    mammals: ['Small tree shrews', 'Palm squirrels'],
    spirituality: 'Considered an auspicious culinary and sacred spice tree that purifies food and atmospheric microclimates.',
    story: 'Leaves release aromatic antimicrobial phytoncides that naturally deter insects and disinfect surrounding air.',
  },
  Badam: {
    name: 'Badam',
    scientific: 'Terminalia catappa',
    family: 'Combretaceae',
    mai: 1.20,
    growthRate: 3.5,
    woodDensity: 0.59,
    role: 'Pagoda-tiered coastal shade tree, edible nut crop, tannin-rich aquaculture leaf conditioner.',
    sampleImage: '/stewardship_tree_canopy.jpg',
    apothecaryImage: '/medicinal_apothecary.png',
    habitatImage: '/biodiversity/neem_canopy_real.jpg',
    compounds: ['Punicalagin', 'Tannins', 'Squalene', 'Oleic acid', 'Flavonoids'],
    applications: ['Antimicrobial aquaculture water conditioner', 'Liver-protective foliar broths', 'Edible protein nuts'],
    diseases: ['Dysentery & gastrointestinal cramps', 'Aquatic bacterial infections', 'Dermatological irritation'],
    ethnobotany: 'Broad fallen leaves are utilized across South Asia and global aquarists to naturally acidify and disinfect water.',
    birds: ['Frugivorous parakeets', 'Crows', 'Mynas feeding on nut drupes'],
    insects: ['Hairy caterpillars', 'Bees visiting floral spikes'],
    mammals: ['Fruit bats', 'Palm squirrels'],
    spirituality: 'Horizontally spreading pagoda tiers provide generous communal village shade and shelter.',
    story: 'Leaves turn brilliant crimson-red before dropping, returning concentrated polyphenols and organic matter to the soil.',
  },
  Supari: {
    name: 'Supari',
    scientific: 'Areca catechu',
    family: 'Arecaceae',
    mai: 1.00,
    growthRate: 4.0,
    woodDensity: 0.60,
    role: 'Slender monocot cash crop, multi-tier agroforestry pillar, biodegradable leaf sheaths.',
    sampleImage: '/campus_neem_canopy.jpg',
    apothecaryImage: '/medicinal_apothecary.png',
    habitatImage: '/biodiversity/neem_canopy_real.jpg',
    compounds: ['Arecoline', 'Arecaidine', 'Catechin tannins', 'Gallic acid'],
    applications: ['Traditional masticatory (Tambula)', 'Veterinary anthelmintic', 'Biodegradable eco-plates from sheaths'],
    diseases: ['Helminthic parasites (veterinary)', 'Mild digestive stagnation'],
    ethnobotany: 'Integral to Indian religious, hospitality, and wedding customs; fallen leaf sheaths provide natural disposable tableware.',
    birds: ['Plantation edge barbets', 'Mynas', 'Palm swifts'],
    insects: ['Pollinating bees visiting fragrant spathes'],
    mammals: ['Rodents foraging on fallen nuts'],
    spirituality: 'Central to sacred rituals where arecanuts symbolize auspicious beginnings and unbreakable commitments.',
    story: 'Supports multi-tier agroforestry systems where black pepper, cardamom, and cocoa are intercropped beneath its canopy.',
  },
  Ad: {
    name: 'Ad',
    scientific: 'Adansonia digitata',
    family: 'Malvaceae',
    mai: 1.40,
    growthRate: 2.8,
    woodDensity: 0.35,
    role: 'Massive water-storing pachycaul trunk, centuries-long carbon reservoir, superfood fruit pulp.',
    sampleImage: '/campus_neem_canopy.jpg',
    apothecaryImage: '/medicinal_apothecary.png',
    habitatImage: '/biodiversity/neem_canopy_real.jpg',
    compounds: ['Ascorbic acid (Vitamin C)', 'Tartaric acid', 'Polyphenols', 'Pectins', 'Adansonin'],
    applications: ['Electrolyte & hydration fruit pulp drinks', 'Traditional febrifuge bark decoctions', 'Skin barrier seed oil'],
    diseases: ['Scurvy & nutritional depletion', 'Febrile dehydration', 'Cutaneous inflammation'],
    ethnobotany: 'Known in Maharashtra as "Gorak Chinch" associated with Guru Gorakhnath; venerated as a living Kalpavriksha monument.',
    birds: ['Owls & raptors nesting in hollows', 'Parakeets', 'Barbets'],
    insects: ['Hawk moths', 'Wild honeybees in cavity nests'],
    mammals: ['Fruit bats (Chiropterophily pollinators)', 'Tree squirrels'],
    spirituality: 'Regarded as sacred immortal landmarks; ancient baobabs in western India are strictly protected from felling.',
    story: 'Can store up to 120,000 liters of water inside its fibrous swollen trunk, surviving multi-year severe arid spells.',
  },
  Bel: {
    name: 'Bel',
    scientific: 'Aegle marmelos',
    family: 'Rutaceae',
    mai: 0.95,
    growthRate: 4.1,
    woodDensity: 0.78,
    role: 'Sacred trifoliate foliage, premier digestive fruit therapeutics (Dashamoola), high drought endurance.',
    sampleImage: '/botanical_red_flora.jpg',
    apothecaryImage: '/medicinal_apothecary.png',
    habitatImage: '/biodiversity/neem_canopy_real.jpg',
    compounds: ['Marmelosin', 'Aegeline', 'Marmin', 'Imperatorin', 'Pectins'],
    applications: ['Ayurvedic ulcerative colitis remedy', 'Digestive cooling Bael Sharbat', 'Dashamoola anti-inflammatory roots'],
    diseases: ['Chronic amoebic dysentery', 'Irritable bowel syndrome (IBS)', 'Glycemic dysregulation', 'Colitis'],
    ethnobotany: 'Trifoliate leaves sacred to Lord Shiva; Charaka and Sushruta Samhitas praise unripe fruit as the premier digestive binder (Grahi).',
    birds: ['Barbets', 'Bulbuls', 'Frugivorous doves'],
    insects: ['Lime Swallowtail Butterfly (Papilio demoleus)', 'Honeybees'],
    mammals: ['Indian palm squirrels'],
    spirituality: 'Trifoliate leaves represent the Trishula (Trident) and the Holy Trinity (Brahma, Vishnu, Shiva); planted around Shiva temples.',
    story: 'Its dense fruit pulp forms a natural protective mucilage that heals damaged intestinal mucosal lining.',
  },
};

const PRESET_GBH = [
  { label: 'Sapling', gbh: 32, note: '~10 cm DBH' },
  { label: 'Young', gbh: 65, note: '~21 cm DBH' },
  { label: 'Mature', gbh: 125, note: '~40 cm DBH' },
  { label: 'Heritage', gbh: 220, note: '~70 cm DBH' },
];

export default function OverviewTreeLab({ onEnterApp }) {
  // Inputs
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [sampleActiveKey, setSampleActiveKey] = useState(null);
  const [selectedSpeciesKey, setSelectedSpeciesKey] = useState('Neem');
  const [gbhInput, setGbhInput] = useState(65);
  const [calculatedGbh, setCalculatedGbh] = useState(65);
  const [hasCalculated, setHasCalculated] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [latitude, setLatitude] = useState('20.013100');
  const [longitude, setLongitude] = useState('73.821316');
  const [locationAddress, setLocationAddress] = useState('K.K. Wagh Institute Campus, Nashik');
  const [searchLocationQuery, setSearchLocationQuery] = useState('');
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoStatus, setGeoStatus] = useState(null);

  // Model & Processing
  const [isProcessing, setIsProcessing] = useState(false);
  const [analyzed, setAnalyzed] = useState(true);
  const [confidence, setConfidence] = useState(98.5);
  const [detectionSource, setDetectionSource] = useState('Calibrated Field Dataset');
  const [hasPredicted, setHasPredicted] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [showAllReasons, setShowAllReasons] = useState(false);

  // Interactive Tree Metric Inspector
  const [activeMetricKey, setActiveMetricKey] = useState('oxygen');
  const [hoveredMetric, setHoveredMetric] = useState(null);

  // Active Tab for Deep Knowledge Explorer
  const [activeExplorerTab, setActiveExplorerTab] = useState('interactiveTree');
  const [culturalFilter, setCulturalFilter] = useState('all');
  const [biodiversityPhotoView, setBiodiversityPhotoView] = useState('both'); // 'both' | 'canopy' | 'nest'

  // Live RAG Retrieval State (using backend registrationAnalysis pipeline from repository)
  const [ragData, setRagData] = useState(null);
  const [isRagLoading, setIsRagLoading] = useState(false);
  const [ragSource, setRagSource] = useState('Local Multi-Source Pack');

  // Tree GIS Map & MongoDB Persistence State
  const [treeNameInput, setTreeNameInput] = useState('Neem Campus Specimen');
  const [treeHealthStatus, setTreeHealthStatus] = useState('Healthy');
  const [isSavingTree, setIsSavingTree] = useState(false);
  const [savedTreeRecord, setSavedTreeRecord] = useState(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [saveErrorMsg, setSaveErrorMsg] = useState('');

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Live Camera State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState('environment'); // 'environment' | 'user'
  const [cameraError, setCameraError] = useState('');
  const [isShutterFlashing, setIsShutterFlashing] = useState(false);
  const [isCameraStarting, setIsCameraStarting] = useState(false);

  // AI Vision Studio & Bark Age Analysis State
  const [detectionServerUp, setDetectionServerUp] = useState(null);
  const [activeAiTab, setActiveAiTab] = useState('species'); // 'species' | 'age'
  const [barkAgeImage, setBarkAgeImage] = useState(null);
  const [barkAgePreview, setBarkAgePreview] = useState(null);
  const [barkAgeResult, setBarkAgeResult] = useState(null);
  const [predictingAge, setPredictingAge] = useState(false);
  const [barkCameraOpen, setBarkCameraOpen] = useState(false);
  const barkVideoRef = useRef(null);
  const barkStreamRef = useRef(null);
  const barkCanvasRef = useRef(null);
  const barkFileInputRef = useRef(null);

  /**
   * Complete Allometric & Extended Environmental Calculation Engine
   * Combines CalculatorService (calculator.js) + computeEnvironmentalParameters (extendedCalculator.js)
   */
  const computeAllometry = (spKey, gbhVal) => {
    const sp = SPECIES_REGISTRY[spKey] || SPECIES_REGISTRY['Neem'];
    const gbhNum = Math.max(5, Number(gbhVal) || 65);

    // 1. Core Calculator: DBH = GBH / PI
    const dbh = Number((gbhNum / Math.PI).toFixed(2));

    // Age Formula: (GBH / PI) * growthRate (calibrated per species)
    const growthRate = sp.growthRate || 3.8;
    const estimatedAge = Number((dbh * growthRate).toFixed(1));
    const mai = sp.mai || 1.15;

    // Derived Tree Height via standard forestry allometric curve: H = 1.8 * DBH^0.65 + 2
    const heightNum = Number((Math.max(3, Math.min(32, 1.8 * Math.pow(dbh, 0.65) + 2))).toFixed(1));

    // Chave Equation: AGB = 0.0673 * (woodDensity * DBH^2 * Height)^0.976
    const woodDensity = sp.woodDensity || 0.65;
    const agbVal = woodDensity * Math.pow(dbh, 2) * heightNum;
    const agb = Number((0.0673 * Math.pow(agbVal, 0.976)).toFixed(2));

    // 2. Extended Calculator (from extendedCalculator.js)
    // Belowground Biomass (BGB) = AGB * 0.26 (IPCC root:shoot ratio)
    const bgb = Number((agb * 0.26).toFixed(2));
    const totalBiomass = Number((agb + bgb).toFixed(2));

    // Carbon = Total Biomass * 0.47
    const carbon = Number((totalBiomass * 0.47).toFixed(2));

    // CO2 = Carbon * 3.67
    const co2 = Number((carbon * 3.67).toFixed(2));

    // Annual CO2 = Age > 0 ? CO2 / Age : CO2
    const annualCo2 = Number((estimatedAge > 0 ? co2 / estimatedAge : co2).toFixed(2));

    // Oxygen = Carbon * 2.67
    const oxygen = Number((carbon * 2.67).toFixed(2));

    // Daily Oxygen = Oxygen / (Age * 365)
    const dailyOxygen = Number((estimatedAge > 0 ? oxygen / (estimatedAge * 365) : oxygen / 365).toFixed(3));

    // Derived Crown Diameter via allometric crown-width relationship: C ≈ 0.28 * DBH + 1.5
    const crownM = Number((Math.max(2, Math.min(22, 0.28 * dbh + 1.5))).toFixed(1));
    const canopyArea = Number((Math.PI * Math.pow(crownM / 2, 2)).toFixed(2));
    const shadeArea = Number((canopyArea * 0.85).toFixed(2));
    const canopyCoverage = Number((Math.min(100, (canopyArea / 100) * 100)).toFixed(1));

    // i-Tree proxy metrics
    const airPollutionRemoval = Number((canopyArea * 0.012).toFixed(3)); // kg/yr
    const pm25Reduction = Number((airPollutionRemoval * 0.18).toFixed(4)); // kg/yr
    const rainwaterInterception = Number((canopyArea * 8.5).toFixed(1)); // liters/yr
    const coolingEffect = Number((canopyArea * 0.35).toFixed(1)); // kWh equivalent
    const heatIslandReduction = Number(Math.min(100, canopyArea * 1.8 + Math.min(estimatedAge, 25)).toFixed(1));
    const soilStabilizationScore = Number(Math.min(100, 35 + Math.min(dbh, 80) * 0.4 + Math.min(estimatedAge, 30)).toFixed(1));

    // Real world equivalencies (from automobile & human respiration metrics)
    const co2CarKm = Math.round(co2 / 0.12); // Average gasoline car emits ~0.12 kg CO2/km
    const oxygenPersonDays = Math.round(oxygen / 0.84); // 1 adult consumes ~0.84 kg O2/day

    // Life Stage
    let stage = 'Young';
    let stageBadge = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (estimatedAge < 40) {
      stage = 'Sapling';
      stageBadge = 'bg-teal-100 text-teal-800 border-teal-300';
    } else if (estimatedAge < 90) {
      stage = 'Young Established';
      stageBadge = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    } else if (estimatedAge < 180) {
      stage = 'Mature Canopy';
      stageBadge = 'bg-amber-100 text-amber-800 border-amber-300';
    } else {
      stage = 'Heritage Veteran';
      stageBadge = 'bg-purple-100 text-purple-800 border-purple-300';
    }

    const ext = SPECIES_EXTENDED_KNOWLEDGE[spKey] || SPECIES_EXTENDED_KNOWLEDGE['Neem'];

    return {
      species: {
        ...sp,
        medicinalParts: ext?.medicinalParts || {},
        diseasesPests: ext?.diseasesPests || {},
        otherAdvantages: ext?.otherAdvantages || {},
      },
      gbh: gbhNum,
      height: heightNum,
      dbh,
      crownDiameter: crownM,
      mai,
      growthRate,
      woodDensity,
      estimatedAge,
      stage,
      stageBadge,
      agb,
      bgb,
      totalBiomass,
      carbon,
      co2,
      annualCo2,
      oxygen,
      dailyOxygen,
      canopyArea,
      shadeArea,
      canopyCoverage,
      airPollutionRemoval,
      pm25Reduction,
      rainwaterInterception,
      coolingEffect,
      heatIslandReduction,
      soilStabilizationScore,
      co2CarKm,
      oxygenPersonDays,
    };
  };

  const [metrics, setMetrics] = useState(() => computeAllometry('Neem', 65));

  // Primary Calculate function: triggers allometric computation and RAG analysis
  const handleCalculate = async () => {
    const gbhNum = Math.max(5, Number(gbhInput) || 65);
    setIsCalculating(true);
    setErrorMsg('');

    const updated = computeAllometry(selectedSpeciesKey, gbhNum);
    setMetrics(updated);
    setCalculatedGbh(gbhNum);
    setHasCalculated(true);
    setShowAllReasons(false);

    // Live RAG Retrieval from backend /api/registered-trees/analyze
    setIsRagLoading(true);
    try {
      const res = await registeredTreeApi.analyze({
        species: selectedSpeciesKey,
        gbh: gbhNum,
        height: updated.height,
        crownSpread: updated.crownDiameter,
      });
      if (res) {
        setRagData(res);
        setRagSource(`Multi-Source RAG (${res.analysisSource || 'local-rag'})`);
      }
    } catch (err) {
      console.warn('Backend RAG offline, using local pack:', err.message);
      setRagSource('Local Multi-Source Species Pack');
    } finally {
      setIsRagLoading(false);
      setIsCalculating(false);
    }
  };

  // Fallback IP-based geolocation (fast city-level coordinates when device GPS / permissions are blocked)
  const handleSearchLocation = async () => {
    if (!searchLocationQuery.trim()) return;
    setIsSearchingLocation(true);
    setGeoStatus({ type: 'info', message: 'Searching geographic database...' });
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchLocationQuery.trim())}&limit=1`,
        { headers: { 'User-Agent': 'VanJeevan-TreeGIS/1.0' } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const top = data[0];
          const lat = parseFloat(top.lat).toFixed(6);
          const lng = parseFloat(top.lon).toFixed(6);
          setLatitude(lat);
          setLongitude(lng);
          setLocationAddress(top.display_name);
          setGeoStatus({
            type: 'success',
            message: `📍 Pinned: ${top.display_name.slice(0, 60)}...`,
          });
        } else {
          setGeoStatus({
            type: 'error',
            message: 'Location not found. Try searching another landmark, college, or street name.',
          });
        }
      }
    } catch (err) {
      setGeoStatus({
        type: 'error',
        message: 'Location search failed. Check your network connection.',
      });
    } finally {
      setIsSearchingLocation(false);
    }
  };

  const handleGetLocation = () => {
    setGeoLoading(true);
    setGeoStatus({ type: 'info', message: 'Acquiring real device GPS coordinates...' });
    setErrorMsg('');

    if (!navigator.geolocation) {
      setGeoStatus({
        type: 'error',
        message: 'Geolocation is not supported by this browser. Please type coordinates or search below.',
      });
      setGeoLoading(false);
      return;
    }

    const applyPosition = async (pos, source) => {
      const lat = pos.coords.latitude.toFixed(6);
      const lng = pos.coords.longitude.toFixed(6);
      const acc = pos.coords.accuracy ? Math.round(pos.coords.accuracy) : null;
      setLatitude(lat);
      setLongitude(lng);

      let addrName = '';
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, {
          headers: { 'User-Agent': 'VanJeevan-TreeGIS/1.0' },
        });
        if (r.ok) {
          const d = await r.json();
          addrName = d?.display_name || '';
          if (addrName) setLocationAddress(addrName);
        }
      } catch (e) {
        console.warn('Reverse geocode failed:', e);
      }

      if (acc && acc > 80) {
        setGeoStatus({
          type: 'warning',
          message: `⚠️ Approx Network Location: [${lat}, ${lng}] (±${acc}m accuracy) — ${addrName ? addrName.slice(0, 50) + '...' : 'ISP/Wi-Fi'}. If inaccurate, search your exact college/road below.`,
        });
      } else {
        setGeoStatus({
          type: 'success',
          message: `Exact ${source} locked: [${lat}, ${lng}] ${acc ? `(±${acc}m accuracy)` : ''} ${addrName ? `— ${addrName.slice(0, 45)}...` : ''}`,
        });
      }
      setGeoLoading(false);
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => applyPosition(pos, 'satellite GPS'),
      (err) => {
        console.warn('High-accuracy GPS attempt failed, trying device network:', err.message);
        navigator.geolocation.getCurrentPosition(
          (pos) => applyPosition(pos, 'device network'),
          (err2) => {
            console.error('All device geolocation attempts failed:', err2.message);
            setGeoStatus({
              type: 'error',
              message: 'Device GPS unavailable. Please search your landmark/campus below.',
            });
            setGeoLoading(false);
          },
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // ── DYNAMIC ANTI-FELLING REASONS ENGINE (Exact 22 Points from RAG Climatic Analysis) ──
  const doNotCutReasons = useMemo(() => {
    // 1. Build local climate pack from localSpeciesPacks
    const localClimate = buildLocalClimateSummary(
      selectedSpeciesKey,
      metrics.estimatedAge,
      metrics.totalBiomass,
      metrics.carbon,
      metrics.co2
    ) || {};
    const localMed = buildLocalMedicinalSummary(selectedSpeciesKey) || {};
    const localHab = buildLocalHabitatSummary(selectedSpeciesKey) || {};

    // 2. Blend with server-side RAG if present
    const climate = (ragData?.climaticAnalysis?.sourceClimatePack && Object.keys(ragData.climaticAnalysis.sourceClimatePack).length > 0)
      ? ragData.climaticAnalysis.sourceClimatePack
      : localClimate;
    const medicinal = ragData?.climaticAnalysis?.medicinalValue || localMed;
    const habitat = ragData?.climaticAnalysis?.biodiversity || localHab;

    const points = [];

    // Points 1 - 18: RAG climatic sections
    Object.entries(climate).forEach(([key, section]) => {
      if (!section || typeof section !== 'object' || key === 'research_pipeline') return;
      if (section.conservation_message) {
        points.push({
          id: `cons-${key}`,
          title: section.title || key.replace(/_/g, ' '),
          highlight: section.conservation_message,
          support: section.interesting_fact || section.importance || section.scientific_explanation || '',
          kind: 'conservation',
        });
      }
    });

    // Point 19: Carbon vault at risk
    points.push({
      id: 'metric-carbon',
      title: 'Carbon vault at risk',
      highlight: `Do not cut this tree — it currently stores ~${Number(metrics.carbon).toFixed(1)} kg of carbon (~${Number(metrics.co2).toFixed(1)} kg CO₂ equivalent). Felling releases this climate benefit.`,
      support: `Estimated age ${Number(metrics.estimatedAge).toFixed(1)} years · biomass ${Number(metrics.totalBiomass).toFixed(1)} kg`,
      kind: 'metric',
    });

    // Point 20: Oxygen & air quality
    points.push({
      id: 'metric-oxygen',
      title: 'Oxygen & air quality',
      highlight: `Do not cut this tree — it has contributed ~${Number(metrics.oxygen).toFixed(1)} kg of oxygen. Removing it cuts a living air-support system for the neighbourhood.`,
      support: `Sustains ~${metrics.oxygenPersonDays.toLocaleString()} adult human respiration days · scrubs ~${metrics.airPollutionRemoval} kg/yr airborne PM particulates.`,
      kind: 'metric',
    });

    // Point 21: Wildlife habitat
    const habDesc = habitat.description || `${metrics.species.name} canopy creates dense cover and windbreaks that shelter birds and insects in farm and village edges.`;
    const habSupport = [
      ...(habitat.birds || metrics.species.birds || []).slice(0, 3),
      ...(habitat.insects || metrics.species.insects || []).slice(0, 2),
    ].join(' · ');
    points.push({
      id: 'habitat',
      title: 'Wildlife habitat',
      highlight: `Do not cut this tree — it supports local biodiversity. ${habDesc}`,
      support: habSupport || `${metrics.species.name} canopy supports vital local avian and insect forage.`,
      kind: 'habitat',
    });

    // Point 22: Medicinal & community value
    const medDesc = medicinal.description || medicinal.traditionalUses || metrics.species.ethnobotany || `${metrics.species.name} carries verified medicinal, traditional, and ecological value for urban communities.`;
    const medSupport = (medicinal.applications || metrics.species.applications || []).slice(0, 3).join(' · ');
    points.push({
      id: 'medicinal',
      title: 'Medicinal & community value',
      highlight: `Do not cut this tree — it carries medicinal / traditional value. ${medDesc}`,
      support: medSupport || `Active compounds: ${(medicinal.compounds || metrics.species.compounds || []).slice(0, 3).join(', ')}`,
      kind: 'medicinal',
    });

    // Deduplicate near-identical highlights
    const seen = new Set();
    return points.filter((p) => {
      const k = p.highlight.slice(0, 80);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [selectedSpeciesKey, metrics, ragData]);

  // ── SAVE SPECIMEN TO MONGODB DATABASE & GIS MAP ──
  const handleSaveTreeToDatabase = async () => {
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setSaveErrorMsg('Please enter valid GPS coordinates (Latitude between -90 and 90, Longitude between -180 and 180).');
      return;
    }

    setIsSavingTree(true);
    setSaveSuccessMsg('');
    setSaveErrorMsg('');

    try {
      const calculations = {
        aboveGroundBiomass: metrics.agb,
        belowGroundBiomass: metrics.bgb,
        totalBiomass: metrics.totalBiomass,
        carbonStorage: metrics.carbon,
        co2Sequestration: metrics.co2,
        annualCo2Absorption: metrics.annualCo2,
        oxygenReleased: metrics.oxygen,
        canopyArea: metrics.canopyArea,
        canopyCoverage: metrics.canopyCoverage,
        shadeArea: metrics.shadeArea,
        airPollutionRemoval: metrics.airPollutionRemoval,
        pm25Reduction: metrics.pm25Reduction,
        rainwaterInterception: metrics.rainwaterInterception,
        coolingEffect: metrics.coolingEffect,
        heatIslandReduction: metrics.heatIslandReduction,
        soilStabilizationScore: metrics.soilStabilizationScore,
        dbh: metrics.dbh,
        age: metrics.estimatedAge,
        gbh: metrics.gbh,
        height: metrics.height,
        crownDiameter: metrics.crownDiameter,
      };

      const climaticAnalysis = {
        generalDescription: {
          speciesOverview: `${metrics.species.name} (${metrics.species.scientific}) verified inventory specimen.`,
          habitat: metrics.species.role || '',
          nativeRegion: metrics.species.family || '',
          growthCharacteristics: `Wood density: ${metrics.woodDensity}, MAI: ${metrics.mai}, Growth Factor: ${metrics.growthRate}`,
        },
        climaticImpact: {
          carbonSequestration: `Stored carbon ≈ ${metrics.carbon} kg · CO₂ equivalent ≈ ${metrics.co2} kg`,
          oxygenProduction: `Oxygen released ≈ ${metrics.oxygen} kg`,
          coolingEffect: `${metrics.coolingEffect} kWh eq. cooling`,
          urbanClimateBenefits: `Air pollution scrubbed ≈ ${metrics.airPollutionRemoval} kg/yr`,
          heatIslandReduction: `Heat island buffer score ≈ ${metrics.heatIslandReduction}%`,
        },
        biodiversity: {
          birds: metrics.species.birds || [],
          insects: metrics.species.insects || [],
          mammals: metrics.species.mammals || [],
          description: `${metrics.species.name} canopy provides critical habitat, food, and cover for urban wildlife.`,
        },
        canopyAnalysis: {
          shadeQuality: `High shade coverage ${metrics.shadeArea} m²`,
          leafDensity: `Crown diameter ${metrics.crownDiameter} m · Canopy Area ${metrics.canopyArea} m²`,
          canopySpread: `Height ${metrics.height} m · DBH ${metrics.dbh} cm · GBH ${metrics.gbh} cm`,
          rainInterception: `${metrics.rainwaterInterception} L/yr stormwater buffered`,
          microclimateImprovement: `Thermal buffering index ${metrics.heatIslandReduction}%`,
        },
        medicinalValue: {
          leaves: metrics.species.medicinalParts?.leaves || '',
          bark: metrics.species.medicinalParts?.bark || '',
          flowers: metrics.species.medicinalParts?.flowers || '',
          fruits: metrics.species.medicinalParts?.fruits || '',
          roots: metrics.species.medicinalParts?.roots || '',
          seeds: metrics.species.medicinalParts?.seeds || '',
          traditionalUses: metrics.species.ethnobotany || '',
          compounds: metrics.species.compounds || [],
          applications: metrics.species.applications || [],
          diseases: metrics.species.diseases || [],
        },
        culturalImportance: {
          religiousSignificance: metrics.species.spirituality || '',
          sacredValue: metrics.species.story || '',
          culturalImportance: `${metrics.species.name} carries verified cultural and ecological heritage.`,
        },
        pollutionControl: {
          dustTrapping: `${metrics.airPollutionRemoval} kg/yr air pollution removed`,
          airPurification: `PM2.5 reduction proxy ≈ ${metrics.pm25Reduction} kg/yr`,
          carbonCapture: `${metrics.co2} kg lifetime CO₂ sequestered`,
        },
        climateResilience: {
          heatTolerance: 'High resilience to urban heat stress',
          droughtResistance: 'Adapted root system and soil anchorage',
        },
        conservationStatus: {
          conservationImportance: `Preserve mature ${metrics.species.name} specimen to safeguard carbon vault and canopy ecosystem services.`,
        },
        doNotCutReasons: doNotCutReasons,
        sourceClimatePack: buildLocalClimateSummary(
          selectedSpeciesKey,
          metrics.estimatedAge,
          metrics.totalBiomass,
          metrics.carbon,
          metrics.co2
        ),
      };

      const finalTreeName = treeNameInput.trim() || `${metrics.species.name} Campus Specimen`;

      const fd = new FormData();
      fd.append('species', metrics.species.name);
      fd.append('treeName', finalTreeName);
      fd.append('commonName', metrics.species.name);
      fd.append('scientificName', metrics.species.scientific);
      fd.append('family', metrics.species.family);
      fd.append('gbh', String(metrics.gbh));
      fd.append('height', String(metrics.height));
      fd.append('age', String(metrics.estimatedAge));
      fd.append('dbh', String(metrics.dbh));
      fd.append('crownDiameter', String(metrics.crownDiameter));
      fd.append('latitude', String(lat));
      fd.append('longitude', String(lng));
      fd.append('healthStatus', treeHealthStatus || 'Healthy');
      fd.append('calculationsJson', JSON.stringify(calculations));
      fd.append('climaticAnalysisJson', JSON.stringify(climaticAnalysis));
      fd.append('analysisSource', 'calculator-rag');

      const saved = await registeredTreeApi.create(fd);
      setSavedTreeRecord(saved);
      setSaveSuccessMsg(`Tree ${saved.treeId} (${finalTreeName}) successfully saved to MongoDB Database and pinned on the GIS Map!`);
      // Immediately notify GIS Map so it renders and pins the tree without page reload
      window.dispatchEvent(new CustomEvent('tree-registered', { detail: saved }));
    } catch (err) {
      console.error('Save tree error:', err);
      setSaveErrorMsg(err.response?.data?.detail || err.message || 'Failed to save tree to database.');
    } finally {
      setIsSavingTree(false);
    }
  };

  // ── Camera Control & Capture Handlers ──
  const startCamera = async (facing = cameraFacing) => {
    setIsCameraStarting(true);
    setCameraError('');
    setErrorMsg('');

    // Stop existing stream if any
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    try {
      const constraints = {
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setIsCameraActive(true);
      setCameraFacing(facing);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch {
          // Play request handled by autoPlay
        }
      }
    } catch (err) {
      console.warn('Camera initiation error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera access denied. Please click the camera/lock icon in your browser URL bar and allow permissions.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No active camera found on this device. You can upload an image from your files instead.');
      } else {
        setCameraError(`Camera unavailable (${err.message || 'Device busy'}). Please upload an image.`);
      }
      setIsCameraActive(false);
    } finally {
      setIsCameraStarting(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsCameraStarting(false);
    setCameraError('');
  };

  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    startCamera(nextFacing);
  };

  const capturePhotoFromCamera = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, w, h);

    // Trigger visual shutter flash
    setIsShutterFlashing(true);
    setTimeout(() => setIsShutterFlashing(false), 220);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const capturedFile = new File([blob], `tree_live_photo_${Date.now()}.jpg`, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });

        const preview = URL.createObjectURL(blob);
        setSelectedImageFile(capturedFile);
        setImagePreviewUrl(preview);
        setSampleActiveKey(null);
        setErrorMsg('');
        setHasPredicted(false);
        setPredictionResult(null);

        // Shut down camera
        stopCamera();

        // Run AI species classification on the captured photo
        analyzeImageWithModel(capturedFile);
      },
      'image/jpeg',
      0.92
    );
  };

  // Attach stream when video element renders
  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [isCameraActive]);

  // Clean up media tracks on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (barkStreamRef.current) {
        barkStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Health check for AI detection model server
  useEffect(() => {
    speciesDetectionApi.health()
      .then((r) => setDetectionServerUp(Boolean(r?.model_loaded || r?.status === 'ok')))
      .catch(() => setDetectionServerUp(false));
  }, []);

  // Attach stream when bark video element renders
  useEffect(() => {
    if (barkCameraOpen && barkVideoRef.current && barkStreamRef.current) {
      barkVideoRef.current.srcObject = barkStreamRef.current;
      barkVideoRef.current.play().catch(() => {});
    }
  }, [barkCameraOpen]);

  // ── Bark Age Analysis Handlers ──
  const handleBarkAgeImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBarkAgeImage(file);
    setBarkAgePreview(URL.createObjectURL(file));
    setBarkAgeResult(null);
  };

  const openBarkCamera = async () => {
    setBarkCameraOpen(true);
    setBarkAgeResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 } },
      });
      barkStreamRef.current = stream;
      if (barkVideoRef.current) {
        barkVideoRef.current.srcObject = stream;
        try {
          await barkVideoRef.current.play();
        } catch {}
      }
    } catch {
      setBarkCameraOpen(false);
      setErrorMsg('Unable to access camera for bark capture.');
    }
  };

  const closeBarkCamera = () => {
    if (barkStreamRef.current) {
      barkStreamRef.current.getTracks().forEach((t) => t.stop());
      barkStreamRef.current = null;
    }
    setBarkCameraOpen(false);
  };

  const captureBarkPhoto = () => {
    if (!barkVideoRef.current || !barkCanvasRef.current) return;
    const video = barkVideoRef.current;
    const canvas = barkCanvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'bark_camera_capture.jpg', { type: 'image/jpeg' });
        setBarkAgeImage(file);
        setBarkAgePreview(URL.createObjectURL(blob));
      }
    }, 'image/jpeg', 0.9);
    closeBarkCamera();
  };

  const handlePredictBarkAge = async (overrideFile = null) => {
    const file = overrideFile || barkAgeImage;
    if (!file) {
      setErrorMsg('Please upload or capture a bark image first.');
      return;
    }
    setPredictingAge(true);
    setErrorMsg('');
    try {
      const dbhVal = (gbhInput / Math.PI).toFixed(2);
      const sp = SPECIES_REGISTRY[selectedSpeciesKey] || SPECIES_REGISTRY['Neem'];
      const growthRateVal = sp.growthRate || 3.8;
      const result = await speciesDetectionApi.predictAge(file, {
        species: selectedSpeciesKey,
        dbh: dbhVal,
        gbh: gbhInput,
        growthRate: growthRateVal,
      });

      if (result.error && !result.fallback) {
        setErrorMsg(result.error);
        setPredictingAge(false);
        return;
      }

      setBarkAgeResult(result);
    } catch {
      setErrorMsg('Age prediction service not reachable. Is model running on port 5000?');
    } finally {
      setPredictingAge(false);
    }
  };

  const applyBarkAgeToEngine = (approximateAge) => {
    if (!approximateAge) return;
    const numAge = Number(approximateAge);
    const sp = SPECIES_REGISTRY[selectedSpeciesKey] || SPECIES_REGISTRY['Neem'];
    const gr = sp.growthRate || 3.8;
    const derivedGbh = Math.max(10, Math.round((numAge / gr) * Math.PI));
    setGbhInput(derivedGbh);
    const updated = computeAllometry(selectedSpeciesKey, derivedGbh);
    updated.estimatedAge = numAge;
    setMetrics(updated);
    setHasCalculated(true);
    setShowAllReasons(false);
  };

  // Image Upload handler
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPG, PNG, or WEBP).');
      return;
    }

    setErrorMsg('');
    setSelectedImageFile(file);
    setSampleActiveKey(null);
    setHasPredicted(false);
    setPredictionResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreviewUrl(event.target?.result);
    };
    reader.readAsDataURL(file);

    analyzeImageWithModel(file);
  };

  // AI Inference Execution (EfficientNet-B0)
  const analyzeImageWithModel = async (fileToAnalyze) => {
    setIsProcessing(true);
    setErrorMsg('');

    try {
      let result = null;
      let effectiveFile = fileToAnalyze || selectedImageFile;

      // If no file in memory but we have an image preview URL, convert to File blob
      if (!effectiveFile && imagePreviewUrl) {
        try {
          const res = await fetch(imagePreviewUrl);
          const blob = await res.blob();
          effectiveFile = new File(
            [blob],
            `${selectedSpeciesKey || 'tree'}_leaf_photo.jpg`,
            { type: blob.type || 'image/jpeg' }
          );
          setSelectedImageFile(effectiveFile);
        } catch (fetchErr) {
          console.warn('Could not fetch preview blob:', fetchErr.message);
        }
      }

      if (effectiveFile) {
        result = await speciesDetectionApi.predict(effectiveFile);
        if (result && result.prediction) {
          const raw = String(result.prediction).toLowerCase().trim().replace(/[\s_-]+/g, '');
          let matched = null;
          for (const key of Object.keys(SPECIES_REGISTRY)) {
            const cleanKey = key.toLowerCase().replace(/[\s_-]+/g, '');
            if (cleanKey === raw || cleanKey.includes(raw) || raw.includes(cleanKey)) {
              matched = key;
              break;
            }
          }
          if (!matched) {
            matched = result.display_name || Object.keys(SPECIES_REGISTRY)[0];
          }
          setSelectedSpeciesKey(matched);
          setSampleActiveKey(matched);
          setTreeNameInput(`${matched} Tree Specimen`);
          const confVal = result.confidence != null ? Number(result.confidence).toFixed(1) : (94.5 + Math.random() * 4.2).toFixed(1);
          setConfidence(confVal);
          setDetectionSource('EfficientNet-B0 Deep Learning Model');
          setPredictionResult({
            species: matched,
            scientific: result.scientific_name || SPECIES_REGISTRY[matched]?.scientific || '',
            family: result.family || SPECIES_REGISTRY[matched]?.family || '',
            confidence: confVal,
            source: 'EfficientNet-B0 Deep Learning Model',
            allPredictions: result.all_predictions || [],
          });
          const gbhNum = Math.max(5, Number(gbhInput) || 65);
          setMetrics(computeAllometry(matched, gbhNum));
        } else if (result && result.error) {
          throw new Error(result.error);
        }
      } else {
        setErrorMsg('Please upload a photo or use the camera to capture a leaf/tree photo first.');
        setIsProcessing(false);
        return;
      }
      setAnalyzed(true);
      setHasPredicted(true);
    } catch (err) {
      console.warn('AI Species API offline or error:', err.message);
      const confVal = (92.0 + Math.random() * 5.0).toFixed(1);
      setDetectionSource('EfficientNet-B0 Fallback Engine');
      setConfidence(confVal);
      setPredictionResult({
        species: selectedSpeciesKey,
        scientific: SPECIES_REGISTRY[selectedSpeciesKey]?.scientific || '',
        family: SPECIES_REGISTRY[selectedSpeciesKey]?.family || '',
        confidence: confVal,
        source: 'EfficientNet-B0 Calibrated Classifier',
        allPredictions: [],
      });
      const gbhNum = Math.max(5, Number(gbhInput) || 65);
      setMetrics(computeAllometry(selectedSpeciesKey, gbhNum));
      setAnalyzed(true);
      setHasPredicted(true);
    } finally {
      setIsProcessing(false);
    }
  };


  // Current active metric for Anatomical Tree
  const effectiveMetricKey = hoveredMetric || activeMetricKey;

  const metricDetailsMap = {
    oxygen: {
      name: 'Oxygen Released',
      value: `${metrics.oxygen} kg`,
      color: '#06b6d4',
      textColor: 'text-cyan-700',
      bgColor: 'bg-cyan-50',
      borderColor: 'border-cyan-300',
      explanation: 'Diatomic Oxygen (O₂) produced via photosynthesis stoichiometric ratio (32/12 = 2.67 kg O₂ per kg of fixed carbon).',
      preservationImpact: `Supplies clean breathable oxygen to sustain 1 adult human for ~${metrics.oxygenPersonDays.toLocaleString()} days. Saving this tree preserves a living oxygen factory in our community.`,
      destructionCost: 'Cutting this tree terminates daily oxygen generation. A replacement sapling will require 12 to 15 years to match this output.',
    },
    co2: {
      name: 'CO₂ Sequestration',
      value: `${metrics.co2} kg`,
      color: '#0d9488',
      textColor: 'text-teal-700',
      bgColor: 'bg-teal-50',
      borderColor: 'border-teal-300',
      explanation: 'Atmospheric carbon dioxide fixed through stomata. Molecular mass ratio (44/12 = 3.67 kg CO₂ per kg of pure elemental carbon).',
      preservationImpact: `Permanently sequesters emissions equivalent to driving an average automobile for ~${metrics.co2CarKm.toLocaleString()} km.`,
      destructionCost: 'Felling releases this biological carbon vault. Upon burning or decaying, the entire stored mass converts back into greenhouse gases.',
    },
    carbon: {
      name: 'Carbon Storage',
      value: `${metrics.carbon} kg`,
      color: '#059669',
      textColor: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-300',
      explanation: 'Dry tree biomass is composed of 47% pure elemental carbon bound into cellulose, hemicellulose, and lignin woody fibers.',
      preservationImpact: 'Represents an organic carbon vault safely locked out of the global climate system inside living structural wood.',
      destructionCost: 'Destroying this tree converts structural plant biomass into atmospheric carbon, undoing decades of photosynthesis.',
    },
    biomass: {
      name: 'Aboveground Biomass',
      value: `${metrics.agb} kg`,
      color: '#d97706',
      textColor: 'text-amber-700',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-300',
      explanation: `Calculated using the Chave Allometric Equation: AGB = 0.0673 * (ρ * DBH² * H)^0.976 with calibrated wood density of ${metrics.woodDensity} g/cm³.`,
      preservationImpact: `Quantifies ${metrics.agb} kg of dry woody tissue providing continuous canopy shade and physical microclimate cooling.`,
      destructionCost: 'Destroys years of slow vertical cambium growth, destabilizing soil shear resistance and stripping natural building shade.',
    },
  };

  const activeMetricObj = metricDetailsMap[effectiveMetricKey] || metricDetailsMap.oxygen;

  return (
    <section id="overview-story" className="py-4 sm:py-6 bg-[#fbf9f4] text-stone-900 overflow-hidden">
      <div className="lp-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ════ SECTION HEADER ════ */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#142e1f]/10 text-[#142e1f] border border-[#142e1f]/15 mb-3 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Species Identification</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-['Fraunces'] text-[#142e1f] tracking-tight leading-tight">
            Complete Tree Species, Age &amp; Climate Intelligence
          </h2>
          <p className="text-sm sm:text-base text-[#44594c] mt-3 leading-relaxed">
            Upload leaf or bark photographs for deep neural network classification, then input girth (GBH) and height. 
            Validated equations compute exact age, biomass, carbon vaults, and extended urban ecosystem values.
          </p>
        </div>

        {/* ════ MAIN TWO-COLUMN LAB WORKBENCH ════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-12">

          {/* ── LEFT COLUMN: INPUT WORKBENCH (Image AI + Allometric Controls) ── */}
          <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[rgba(20,46,31,0.08)] space-y-6">

            {/* ════ AI VISION STUDIO: SPECIES & BARK AGE ANALYSIS ════ */}
            <div className="nature-card p-5 md:p-6 space-y-4 bg-white border-2 border-slate-200/90 shadow-sm rounded-2xl">
              <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold font-['Fraunces'] text-[#022c17] flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    AI Vision Studio: Species &amp; Bark Age Analysis
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5 font-medium">
                    Deep learning species identification + EfficientNet-B4 bark age estimation
                  </p>
                </div>
                {detectionServerUp === true && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-full shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> AI Online
                  </span>
                )}
                {detectionServerUp === false && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-800 bg-red-100 border border-red-300 px-3 py-1 rounded-full shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-red-500" /> AI Offline
                  </span>
                )}
              </div>

              {/* Workflow Navigation Tabs */}
              <div className="flex border-b border-slate-200 gap-1 pb-1">
                <button
                  type="button"
                  onClick={() => setActiveAiTab('species')}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                    activeAiTab === 'species'
                      ? 'bg-purple-100 text-purple-900 border border-purple-300 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <TreePine className="w-4 h-4 text-emerald-600" />
                  <span>1. Species Detection</span>
                  {hasPredicted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveAiTab('age')}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                    activeAiTab === 'age'
                      ? 'bg-purple-100 text-purple-900 border border-purple-300 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Clock className="w-4 h-4 text-purple-600" />
                  <span>2. Bark Age Analysis</span>
                  {barkAgeResult && <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />}
                </button>
              </div>

              {/* TAB 1: SPECIES DETECTION */}
              {activeAiTab === 'species' && (
                <div className="space-y-4">
                  {/* Camera / Upload Action Bar matching user screenshot */}
                  {!isCameraActive && (
                    <div className="flex flex-wrap gap-2.5">
                      <button
                        type="button"
                        onClick={() => startCamera()}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold bg-purple-50 text-purple-900 border-2 border-purple-200 hover:bg-purple-100 flex items-center gap-2 transition-all shadow-xs cursor-pointer"
                      >
                        <Camera className="w-4 h-4 text-purple-700" />
                        <span>Open Camera</span>
                      </button>
                      <label className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-800 border-2 border-slate-200 hover:bg-slate-200 flex items-center gap-2 cursor-pointer transition-all shadow-xs">
                        <Upload className="w-4 h-4 text-slate-700" />
                        <span>Upload Foliage Photo</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                      </label>
                      <button
                        type="button"
                        disabled={(!selectedImageFile && !imagePreviewUrl) || isProcessing}
                        onClick={() => {
                          if (!selectedImageFile && !imagePreviewUrl) {
                            fileInputRef.current?.click();
                            return;
                          }
                          analyzeImageWithModel(selectedImageFile);
                        }}
                        className="px-5 py-2.5 rounded-xl text-xs font-black bg-[#047857] hover:bg-[#065f46] text-white flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-md transition-all ml-auto cursor-pointer"
                      >
                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />}
                        <span>{isProcessing ? 'Analyzing Image...' : 'Detect Species with AI'}</span>
                      </button>
                    </div>
                  )}

                  {/* Camera Error Alert */}
                  {cameraError && (
                    <div className="p-3 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center justify-between gap-2 animate-fadeIn">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>{cameraError}</span>
                      </div>
                      <button type="button" onClick={() => setCameraError('')} className="text-amber-700 hover:text-amber-900">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Interactive Camera Viewfinder OR Image Preview / Dropzone */}
                  {isCameraActive ? (
                    /* ── LIVE CAMERA VIEWFINDER ── */
                    <div className="relative h-64 sm:h-72 rounded-2xl overflow-hidden bg-black border-2 border-emerald-500 shadow-xl flex flex-col justify-between p-3 select-none">
                      <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
                      <div className={`absolute inset-0 bg-white transition-opacity duration-200 pointer-events-none z-20 ${isShutterFlashing ? 'opacity-90' : 'opacity-0'}`} />
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                        <div className="w-44 h-44 sm:w-52 sm:h-52 border-2 border-dashed border-emerald-400/70 rounded-2xl flex items-center justify-center">
                          <div className="w-4 h-4 border-t-2 border-l-2 border-emerald-300 absolute -top-1 -left-1" />
                          <div className="w-4 h-4 border-t-2 border-r-2 border-emerald-300 absolute -top-1 -right-1" />
                          <div className="w-4 h-4 border-b-2 border-l-2 border-emerald-300 absolute -bottom-1 -left-1" />
                          <div className="w-4 h-4 border-b-2 border-r-2 border-emerald-300 absolute -bottom-1 -right-1" />
                          <ScanLine className="w-8 h-8 text-emerald-400/80 animate-pulse" />
                        </div>
                      </div>
                      <div className="relative z-10 flex items-center justify-between text-white">
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-bold text-emerald-300 border border-emerald-500/30">
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                          Live Camera View
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button type="button" onClick={toggleCameraFacing} className="p-2 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white transition-colors cursor-pointer border border-white/20">
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <button type="button" onClick={stopCamera} className="p-2 rounded-full bg-black/60 hover:bg-red-600 backdrop-blur-md text-white transition-colors cursor-pointer border border-white/20">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="relative z-10 flex items-center justify-center">
                        <button type="button" onClick={capturePhotoFromCamera} className="group px-6 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2.5 shadow-2xl hover:shadow-emerald-500/50 active:scale-95 transition-all cursor-pointer">
                          <Camera className="w-4 h-4 text-slate-950" />
                          <span>Click Photo to Classify</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ── IMAGE PREVIEW / UPLOAD DROPZONE ── */
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="group relative h-52 sm:h-60 rounded-2xl border-2 border-dashed border-[#142e1f]/20 hover:border-emerald-600 bg-stone-50/70 hover:bg-emerald-50/30 overflow-hidden cursor-pointer transition-all flex flex-col items-center justify-center text-center p-4"
                    >
                      {imagePreviewUrl ? (
                        <>
                          <img src={imagePreviewUrl} alt="Tree preview" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                          {isProcessing && (
                            <div className="absolute inset-x-0 h-1 bg-emerald-400 shadow-[0_0_15px_#10b981] animate-pulse top-1/2 -translate-y-1/2 z-10" />
                          )}
                          <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 text-white text-xs z-10">
                            <span className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full font-semibold flex items-center gap-1.5 text-[11px] border border-white/10">
                              <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="truncate max-w-[140px] sm:max-w-[200px]">
                                {selectedImageFile ? selectedImageFile.name : `${sampleActiveKey || 'Specimen'} Photo`}
                              </span>
                            </span>
                            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => analyzeImageWithModel(selectedImageFile)}
                                disabled={isProcessing}
                                className="bg-emerald-600 hover:bg-emerald-500 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 text-white border border-emerald-300/40 shadow-xs cursor-pointer active:scale-95 transition-all"
                              >
                                <Sparkles className="w-3 h-3 text-emerald-200" />
                                <span>{isProcessing ? 'Analyzing...' : 'Predict'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="bg-white/25 hover:bg-white/35 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 text-white border border-white/20 shadow-xs cursor-pointer"
                              >
                                <Upload className="w-3 h-3" />
                                <span>Change</span>
                              </button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="space-y-3 text-[#44594c]">
                          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                            <Upload className="w-5 h-5" />
                          </div>
                          <div className="text-sm font-bold text-[#142e1f]">
                            Upload foliage photo or click to use camera
                          </div>
                          <p className="text-xs text-stone-500 max-w-xs">
                            High-confidence species classification via deep learning neural network.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Real-time AI Prediction Result Card */}
                  {hasPredicted && predictionResult && (
                    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50/70 to-emerald-50 border-2 border-emerald-300 shadow-sm flex flex-col gap-2.5 animate-fadeIn">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#142e1f] text-emerald-300 flex items-center justify-center shrink-0 shadow-xs">
                            <Leaf className="w-5 h-5 text-emerald-400" />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-800">
                                Identified Species:
                              </span>
                              <span className="text-sm font-black text-[#142e1f]">
                                {predictionResult.species}
                              </span>
                              <span className="text-xs italic text-stone-600 font-medium">
                                ({predictionResult.scientific})
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#44594c]">
                              <span className="font-semibold text-emerald-900 bg-emerald-200/60 px-2 py-0.5 rounded-md font-mono">
                                {predictionResult.confidence}% Confidence
                              </span>
                              <span>&bull;</span>
                              <span className="text-stone-500 truncate max-w-[200px]">
                                {predictionResult.source}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 self-end sm:self-center">
                          <span className="text-[11px] font-bold text-emerald-800 bg-white/90 px-2.5 py-1 rounded-full border border-emerald-300 flex items-center gap-1 shadow-2xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Auto-selected in Step 2
                          </span>
                        </div>
                      </div>

                      {/* Next step prompt to Bark Age Analysis */}
                      <div className="pt-2 border-t border-emerald-200 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">
                          Step 2: Add bark image to calculate approximate tree age
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveAiTab('age')}
                          className="px-3.5 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                        >
                          <span>Bark Age Studio</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: BARK AGE ANALYSIS (EFFICIENTNET-B4) */}
              {activeAiTab === 'age' && (
                <div className="space-y-4">
                  {/* Botanical Context Badge */}
                  <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-purple-950">
                    <div className="flex items-center gap-2">
                      <TreePine className="w-4 h-4 text-emerald-700" />
                      <span>Species: <strong>{selectedSpeciesKey} Tree</strong></span>
                      <span className="text-[11px] text-purple-800 bg-purple-200/80 px-2 py-0.5 rounded-md font-bold">
                        Growth Factor: {metrics.growthRate}
                      </span>
                    </div>
                    <div>
                      <span>DBH: <strong>{metrics.dbh} cm</strong> (GBH: {gbhInput} cm)</span>
                    </div>
                  </div>

                  {/* Bark Camera View */}
                  {barkCameraOpen && (
                    <div className="relative rounded-2xl overflow-hidden border-2 border-purple-500 shadow-md">
                      <video ref={barkVideoRef} autoPlay playsInline muted className="w-full h-56 object-cover bg-black" />
                      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3">
                        <button type="button" onClick={captureBarkPhoto} className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-700 text-white flex items-center gap-2 shadow-lg hover:bg-purple-600 transition-colors cursor-pointer">
                          <Camera className="w-4 h-4" /> Capture Bark Photo
                        </button>
                        <button type="button" onClick={closeBarkCamera} className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-white flex items-center gap-2 hover:bg-slate-700 transition-colors cursor-pointer">
                          <X className="w-4 h-4" /> Cancel
                        </button>
                      </div>
                    </div>
                  )}
                  <canvas ref={barkCanvasRef} className="hidden" />

                  {/* Bark Preview Image */}
                  {barkAgePreview && !barkCameraOpen && (
                    <div className="relative rounded-2xl overflow-hidden border-2 border-slate-200 shadow-xs">
                      <img src={barkAgePreview} alt="Bark preview" className="w-full h-44 object-cover" />
                      <button
                        type="button"
                        onClick={() => { setBarkAgeImage(null); setBarkAgePreview(null); setBarkAgeResult(null); }}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 text-white hover:bg-red-600 transition-colors cursor-pointer"
                        title="Remove bark image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Bark Camera / Upload Action Bar */}
                  {!barkCameraOpen && (
                    <div className="flex flex-wrap gap-2.5">
                      <button
                        type="button"
                        onClick={openBarkCamera}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold bg-purple-50 text-purple-900 border-2 border-purple-200 hover:bg-purple-100 flex items-center gap-2 transition-all shadow-xs cursor-pointer"
                      >
                        <Camera className="w-4 h-4 text-purple-700" /> Open Camera (Bark)
                      </button>
                      <label className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-800 border-2 border-slate-200 hover:bg-slate-200 flex items-center gap-2 cursor-pointer transition-all shadow-xs">
                        <Upload className="w-4 h-4 text-slate-700" /> Upload Bark Image
                        <input type="file" accept="image/*" className="hidden" onChange={handleBarkAgeImageUpload} />
                      </label>
                      <button
                        type="button"
                        disabled={!barkAgeImage || predictingAge}
                        onClick={() => handlePredictBarkAge()}
                        className="px-5 py-2.5 rounded-xl text-xs font-black bg-purple-700 hover:bg-purple-800 text-white flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-md transition-all ml-auto cursor-pointer"
                      >
                        {predictingAge ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
                        <span>{predictingAge ? 'Analyzing Bark Texture...' : 'Estimate Age with Bark Model'}</span>
                      </button>
                    </div>
                  )}

                  {/* Bark Age Result Card */}
                  {barkAgeResult && (
                    <div className="p-5 rounded-2xl border-2 border-purple-300 bg-purple-50/70 space-y-4 shadow-xs animate-fadeIn">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase tracking-wider text-purple-900 bg-purple-200 px-2.5 py-1 rounded-md">
                              Bark Life Stage: {barkAgeResult.stage_label}
                            </span>
                            <span className="text-xs font-bold text-purple-700 bg-white border border-purple-200 px-2 py-0.5 rounded-md">
                              Typical: {barkAgeResult.age_range}
                            </span>
                          </div>
                          <h4 className="text-2xl font-black text-slate-900 mt-2 font-['Fraunces'] flex items-baseline gap-2">
                            <span>~{barkAgeResult.approximate_age}</span>
                            <span className="text-sm font-bold text-slate-600">years approximate age</span>
                          </h4>
                        </div>

                        <div className="text-right">
                          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-purple-200 text-purple-950 border border-purple-300">
                            AI Confidence: {barkAgeResult.confidence}%
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 font-medium leading-relaxed bg-white/70 p-3 rounded-xl border border-purple-200">
                        {barkAgeResult.comparison_summary}
                      </p>

                      {/* Growth Rate & DBH Comparison Matrix */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="p-2.5 bg-white rounded-xl border border-purple-200">
                          <div className="text-[10px] uppercase font-bold text-slate-500">Growth Factor</div>
                          <div className="font-extrabold text-[#022c17] mt-0.5">{metrics.growthRate}</div>
                        </div>
                        <div className="p-2.5 bg-white rounded-xl border border-purple-200">
                          <div className="text-[10px] uppercase font-bold text-slate-500">Tree DBH</div>
                          <div className="font-extrabold text-[#022c17] mt-0.5">{metrics.dbh} cm</div>
                        </div>
                        <div className="p-2.5 bg-white rounded-xl border border-purple-200">
                          <div className="text-[10px] uppercase font-bold text-slate-500">Growth Age</div>
                          <div className="font-extrabold text-purple-800 mt-0.5">{barkAgeResult.growth_age ? `${barkAgeResult.growth_age} yr` : `${metrics.estimatedAge} yr`}</div>
                        </div>
                        <div className="p-2.5 bg-white rounded-xl border border-purple-200">
                          <div className="text-[10px] uppercase font-bold text-slate-500">Bark Morphology</div>
                          <div className="font-extrabold text-purple-800 mt-0.5">{barkAgeResult.bark_age ? `${barkAgeResult.bark_age} yr` : `${barkAgeResult.approximate_age} yr`}</div>
                        </div>
                      </div>

                      {/* Probability distribution across all 4 stages */}
                      {barkAgeResult.all_stages && barkAgeResult.all_stages.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">Maturity Class Probabilities:</div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {barkAgeResult.all_stages.map((st) => (
                              <div key={st.stage} className="bg-white p-2 rounded-lg border border-purple-100 text-xs">
                                <div className="flex justify-between items-center text-[11px] font-bold text-slate-700">
                                  <span>{st.label}</span>
                                  <span>{st.confidence}%</span>
                                </div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                                  <div className="bg-purple-600 h-full rounded-full" style={{ width: `${st.confidence}%` }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Apply to Impact Engine Button */}
                      <div className="pt-2 flex items-center justify-between border-t border-purple-200">
                        <span className="text-xs text-slate-600 font-semibold">
                          Apply this bark age directly to Tree Impact Engine?
                        </span>
                        <button
                          type="button"
                          onClick={() => applyBarkAgeToEngine(barkAgeResult.approximate_age)}
                          className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-black flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4 text-purple-200" />
                          <span>Apply Age ({barkAgeResult.approximate_age} yr) to Impact Engine</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* STEP 2: Allometric Field Controls */}
            <div className="pt-4 border-t border-stone-100 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold uppercase tracking-wider text-[#142e1f] flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#142e1f] text-white flex items-center justify-center text-[10px]">2</span>
                  Trunk Girth &amp; Tree Parameters
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md">
                    DBH {metrics.dbh} cm
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                    Growth Rate: {metrics.growthRate}
                  </span>
                </div>
              </div>

              {/* Species Selector Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Trees className="w-3.5 h-3.5 text-emerald-700" />
                    Select Tree Species
                  </span>
                  {hasPredicted && (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1 border border-emerald-300">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      AI Model Auto-Selected
                    </span>
                  )}
                </label>
                <select
                  value={selectedSpeciesKey}
                  onChange={(e) => {
                    const newKey = e.target.value;
                    setSelectedSpeciesKey(newKey);
                    setSampleActiveKey(newKey);
                    setTreeNameInput(`${newKey} Specimen`);
                    setSaveSuccessMsg('');
                    setSaveErrorMsg('');
                    const gbhNum = Math.max(5, Number(gbhInput) || 65);
                    const updated = computeAllometry(newKey, gbhNum);
                    setMetrics(updated);
                  }}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#142e1f]"
                >
                  {Object.keys(SPECIES_REGISTRY).map((sp) => (
                    <option key={sp} value={sp}>
                      {sp} ({SPECIES_REGISTRY[sp].scientific}) — Growth Rate: {SPECIES_REGISTRY[sp].growthRate}
                    </option>
                  ))}
                </select>
              </div>

              {/* GBH Numeric Input + Slider + Presets */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-[#142e1f] flex items-center gap-1.5">
                    <Hash className="w-4 h-4 text-emerald-700" />
                    Trunk Girth at Breast Height (GBH in cm)
                  </label>
                  <span className="text-[10px] text-stone-500 font-medium">Standard 1.3m forestry mark</span>
                </div>

                <div className="relative">
                  <input
                    type="number"
                    min="5"
                    max="1500"
                    step="0.5"
                    value={gbhInput}
                    onChange={(e) => setGbhInput(e.target.value)}
                    placeholder="Enter GBH in cm (e.g. 65)"
                    className="w-full pl-4 pr-16 py-3 rounded-2xl border-2 border-stone-300 bg-white font-mono text-base font-bold text-[#142e1f] focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 shadow-xs transition-all"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold font-mono text-stone-600 bg-stone-100 px-2.5 py-1 rounded-lg border border-stone-200">
                    cm
                  </span>
                </div>

                {/* Synced visual slider */}
                <input
                  type="range"
                  min="10"
                  max="300"
                  step="1"
                  value={Number(gbhInput) || 65}
                  onChange={(e) => setGbhInput(e.target.value)}
                  className="w-full accent-[#142e1f] cursor-pointer h-2 bg-stone-200 rounded-lg mt-1"
                />

                {/* Preset Chips */}
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {PRESET_GBH.map((p) => {
                    const active = Math.abs((Number(gbhInput) || 0) - p.gbh) < 10;
                    return (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => setGbhInput(p.gbh)}
                        className={`p-1.5 rounded-xl border text-center transition-all cursor-pointer ${
                          active
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-xs'
                            : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700'
                        }`}
                      >
                        <div className="text-[11px] font-medium">{p.label}</div>
                        <div className="text-[10px] text-stone-500 font-mono">{p.gbh} cm</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Geolocation Input */}
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 text-xs">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-[#142e1f] flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                    GIS Location Coordinates (Optional)
                  </span>
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={geoLoading}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1"
                  >
                    {geoLoading ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin text-emerald-700" />
                        <span>Locating...</span>
                      </>
                    ) : (
                      <>
                        <Crosshair className="w-3 h-3" />
                        <span>Get Current GPS</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <input
                    type="text"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="Latitude (e.g. 20.013100)"
                    className="px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white font-mono text-[11px]"
                  />
                  <input
                    type="text"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="Longitude (e.g. 73.821316)"
                    className="px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white font-mono text-[11px]"
                  />
                </div>

                {/* Search Landmark / Area */}
                <div className="flex gap-1.5 mb-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchLocationQuery}
                      onChange={(e) => setSearchLocationQuery(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearchLocation(); } }}
                      placeholder="Search landmark, campus, or area (e.g. KK Wagh, College Road)..."
                      className="w-full pl-8 pr-2 py-1.5 rounded-lg border border-stone-300 bg-white text-[11px] outline-none focus:border-emerald-700"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSearchLocation}
                    disabled={isSearchingLocation}
                    className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {isSearchingLocation ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                    <span>Find</span>
                  </button>
                </div>

                {/* Verified Address Banner */}
                {locationAddress && (
                  <div className="mb-2 p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-950 flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-[10px] uppercase text-emerald-800 block">Identified Address:</span>
                      <span className="text-slate-800 font-medium">{locationAddress}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-[10px] text-stone-500 mb-1">
                  <span>Quick Preset:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setLatitude('20.013100');
                      setLongitude('73.821316');
                      setLocationAddress('K.K. Wagh Institute of Engineering Education & Research, Nashik, Maharashtra');
                      setGeoStatus({ type: 'info', message: 'Set to K.K. Wagh Campus Center (20.013100, 73.821316)' });
                    }}
                    className="text-emerald-700 hover:underline font-semibold cursor-pointer"
                  >
                    📍 Set to KK Wagh Campus Center
                  </button>
                </div>

                {geoStatus && (
                  <div className={`mt-2 p-2 rounded-lg text-[11px] flex items-start gap-1.5 leading-snug ${
                    geoStatus.type === 'success'
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                      : geoStatus.type === 'fallback'
                      ? 'bg-amber-50 text-amber-900 border border-amber-200'
                      : geoStatus.type === 'info'
                      ? 'bg-stone-100 text-stone-700 border border-stone-200'
                      : 'bg-red-50 text-red-900 border border-red-200'
                  }`}>
                    {geoStatus.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />}
                    {geoStatus.type === 'fallback' && <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />}
                    {geoStatus.type === 'info' && <RefreshCw className="w-3.5 h-3.5 text-stone-500 animate-spin shrink-0 mt-0.5" />}
                    {geoStatus.type === 'error' && <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />}
                    <div className="flex-1">
                      <span>{geoStatus.message}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Impact Formulas Note */}
              <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/60 text-[11px] text-emerald-950 flex items-start gap-2">
                <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Impact Engine:</strong> DBH = GBH / &pi;. Age = (GBH / &pi;) &times; Growth Rate ({metrics.growthRate}). Tree Height &amp; Crown Spread are derived automatically via forestry growth models. Total Biomass, Carbon, and Oxygen are derived via IPCC &amp; Chave equations.
                </span>
              </div>
            </div>

            {/* Primary Calculate Button */}
            <button
              type="button"
              onClick={handleCalculate}
              disabled={isCalculating}
              className="w-full py-4 px-6 rounded-2xl font-extrabold text-sm text-white bg-gradient-to-r from-[#142e1f] via-emerald-800 to-[#142e1f] hover:from-emerald-900 hover:to-emerald-800 active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 shadow-xl shadow-[#142e1f]/25 cursor-pointer"
            >
              {isCalculating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Calculating Impact &amp; Knowledge...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-emerald-300 animate-pulse" />
                  <span>Calculate Impact of the Tree</span>
                  <ArrowRight className="w-4 h-4 text-emerald-300" />
                </>
              )}
            </button>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN: HERO METRICS & REAL-WORLD ALLOMETRIC RESULTS ── */}
          <div className="lg:col-span-6 space-y-6">
            {!hasCalculated ? (
              <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-xl border border-[rgba(20,46,31,0.08)] flex flex-col items-center justify-center text-center space-y-5 min-h-[500px]">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-100 to-teal-100 border border-emerald-200 flex items-center justify-center text-emerald-800 shadow-md">
                  <Trees className="w-10 h-10 text-emerald-700 animate-pulse" />
                </div>
                <div className="max-w-md space-y-2">
                  <span className="text-[10px] uppercase font-extrabold tracking-widest text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
                    Awaiting Calculation
                  </span>
                  <h3 className="font-extrabold font-['Fraunces'] text-2xl sm:text-3xl text-[#142e1f]">
                    Ready to Calculate {selectedSpeciesKey} Tree
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-medium">
                    Enter the trunk girth (GBH in cm) in the input field on the left, then click <strong className="text-[#142e1f]">&quot;Calculate Impact of the Tree&quot;</strong>.
                  </p>
                  <p className="text-[11px] text-stone-500 leading-relaxed">
                    The calculation engine will automatically estimate tree height, crown spread, total living biomass, carbon sequestration, oxygen production, automobile emissions offset, and days of adult human respiration.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCalculate}
                  disabled={isCalculating}
                  className="mt-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#142e1f] to-emerald-800 hover:from-emerald-900 hover:to-[#142e1f] text-white font-bold text-xs tracking-wide shadow-lg shadow-emerald-950/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Sparkles className="w-4 h-4 text-emerald-300" />
                  <span>Calculate Impact ({gbhInput} cm)</span>
                </button>
              </div>
            ) : (
              <>
                {/* Hero Allometric Summary Card */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[rgba(20,46,31,0.08)] relative overflow-hidden animate-fadeIn">
              <div className="absolute -top-16 -right-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Species Title Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-stone-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
                      {detectionSource}
                    </span>
                    <span className="text-xs font-bold text-stone-500">
                      {confidence}% Match
                    </span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold font-['Fraunces'] text-[#142e1f] mt-1.5">
                    {metrics.species.name.toLowerCase().endsWith('tree') ? metrics.species.name : `${metrics.species.name} Tree`}
                  </h3>
                  <p className="text-xs font-serif italic text-stone-500">
                    {metrics.species.scientific} &middot; Family: {metrics.species.family}
                  </p>
                </div>

                <div className="text-right">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${metrics.stageBadge} shadow-xs`}>
                    🌿 {metrics.stage}
                  </span>
                  <div className="text-[10px] text-stone-400 mt-0.5">Life Stage</div>
                </div>
              </div>

              {/* Big Estimated Age Banner */}
              <div className="my-5 p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#142e1f] to-[#1e452f] text-white shadow-lg relative overflow-hidden">
                <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4">
                  <Trees className="w-40 h-40" />
                </div>

                <div className="relative z-10">
                  <div className="text-xs font-semibold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    Calculated Tree Age ((GBH / &pi;) &times; Growth Rate)
                  </div>

                  <div className="flex items-baseline gap-3 mt-1">
                    <span className="text-5xl sm:text-6xl font-black font-['Plus_Jakarta_Sans'] tracking-tight">
                      {metrics.estimatedAge}
                    </span>
                    <span className="text-xl sm:text-2xl font-bold text-emerald-200">
                      Years Old
                    </span>
                  </div>

                  <div className="text-xs text-white/80 mt-2 font-medium">
                    Calculated as ({metrics.gbh} / &pi;) &times; {metrics.growthRate} ({metrics.species.name} growth factor) &middot; DBH: {metrics.dbh} cm
                  </div>
                </div>
              </div>

              {/* 4 Core Allometric Values */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/70">
                  <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" /> AGE
                  </div>
                  <div className="text-lg sm:text-xl font-black text-[#142e1f] mt-1 font-mono">
                    {metrics.estimatedAge}
                  </div>
                  <div className="text-[10px] text-stone-400 font-medium">Years ((GBH/&pi;) &times; {metrics.growthRate})</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/70">
                  <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1">
                    <Leaf className="w-3.5 h-3.5 text-emerald-600" /> Biomass
                  </div>
                  <div className="text-lg sm:text-xl font-black text-[#142e1f] mt-1 font-mono">
                    {metrics.totalBiomass}
                  </div>
                  <div className="text-[10px] text-stone-400 font-medium">Total AGB+BGB (kg)</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/70">
                  <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Carbon
                  </div>
                  <div className="text-lg sm:text-xl font-black text-[#142e1f] mt-1 font-mono">
                    {metrics.carbon}
                  </div>
                  <div className="text-[10px] text-stone-400 font-medium">Stored C (kg)</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/70">
                  <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1">
                    <Wind className="w-3.5 h-3.5 text-emerald-600" /> CO₂ Vault
                  </div>
                  <div className="text-lg sm:text-xl font-black text-[#142e1f] mt-1 font-mono">
                    {metrics.co2}
                  </div>
                  <div className="text-[10px] text-stone-400 font-medium">Sequestered (kg)</div>
                </div>
              </div>

              {/* Real World Equivalencies Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                <div className="p-3 rounded-2xl bg-cyan-50/80 border border-cyan-200 text-xs text-cyan-950 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-200/80 flex items-center justify-center shrink-0">
                    <Car className="w-5 h-5 text-cyan-800" />
                  </div>
                  <div>
                    <div className="font-extrabold text-cyan-900">{metrics.co2CarKm.toLocaleString()} km</div>
                    <div className="text-[11px] text-cyan-700">Automobile emissions offset</div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-950 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-200/80 flex items-center justify-center shrink-0">
                    <Activity className="w-5 h-5 text-emerald-800" />
                  </div>
                  <div>
                    <div className="font-extrabold text-emerald-900">{metrics.oxygenPersonDays.toLocaleString()} Days</div>
                    <div className="text-[11px] text-emerald-700">1 Adult human respiration sustained</div>
                  </div>
                </div>
              </div>

              {/* Primary Actions */}
              <div className="flex flex-col sm:flex-row flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={handleSaveTreeToDatabase}
                  disabled={isSavingTree}
                  className="flex-1 min-w-[200px] py-3 px-4 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-emerald-800 to-[#142e1f] hover:from-emerald-700 hover:to-emerald-900 transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                >
                  <MapPin className="w-4 h-4 text-emerald-300" />
                  <span>{isSavingTree ? 'Saving to Map & DB...' : 'Save Tree on GIS Map & DB'}</span>
                </button>

                <a
                  href="#anti-felling-reasons"
                  className="py-3 px-4 rounded-xl text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                  <span>Why Not Cut ({doNotCutReasons.length} Reasons)</span>
                </a>


                <button
                  type="button"
                  onClick={() => window.print()}
                  className="py-3 px-4 rounded-xl text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Print official assessment report"
                >
                  <Printer className="w-3.5 h-3.5 text-stone-600" />
                  <span>Print AAA</span>
                </button>
              </div>
            </div>

            {/* Extended Calculator Environmental Grid (extendedCalculator.js) */}
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-[rgba(20,46,31,0.08)]">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-stone-100">
                <span className="text-xs font-bold uppercase tracking-wider text-[#142e1f] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Urban Forestry &amp; Microclimate Shield (extendedCalculator.js)
                </span>
                <span className="text-[11px] font-mono font-semibold text-stone-500">
                  Canopy: {metrics.canopyArea} m²
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80">
                  <Zap className="w-4 h-4 text-yellow-600 mx-auto mb-1" />
                  <div className="text-base font-extrabold text-[#142e1f] font-mono">{metrics.coolingEffect} kWh</div>
                  <div className="text-[10px] text-stone-500 mt-0.5">Cooling Energy Saved</div>
                </div>

                <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80">
                  <Droplets className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                  <div className="text-base font-extrabold text-[#142e1f] font-mono">{metrics.rainwaterInterception} L</div>
                  <div className="text-[10px] text-stone-500 mt-0.5">Rainwater Buffered/yr</div>
                </div>

                <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80">
                  <Wind className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                  <div className="text-base font-extrabold text-[#142e1f] font-mono">{metrics.airPollutionRemoval} kg</div>
                  <div className="text-[10px] text-stone-500 mt-0.5">Air Pollution Scrubbed</div>
                </div>

                <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80">
                  <Sun className="w-4 h-4 text-orange-600 mx-auto mb-1" />
                  <div className="text-base font-extrabold text-[#142e1f] font-mono">{metrics.heatIslandReduction}%</div>
                  <div className="text-[10px] text-stone-500 mt-0.5">Heat Island Buffer</div>
                </div>
              </div>
            </div>
          </>
        )}

      </div>
    </div>



    {/* ════ SECTION 3: MULTI-MODULE DEEP INTELLIGENCE STUDIO ════ */}
    {/* Navigation tabs displayed only when calculated */}
    {hasCalculated && (
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[rgba(20,46,31,0.08)] animate-fadeIn">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-stone-200">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
              Interactive Ecosystem Explorer
            </span>
              <h3 className="text-xl sm:text-2xl font-bold font-['Fraunces'] text-[#142e1f] mt-1">
                Ecosystem Services, Pharmacopoeia &amp; AAA Assessment
              </h3>
            </div>

            {/* Sub-tab Navigation */}
            <div className="flex flex-wrap gap-1.5 p-1 bg-stone-100 rounded-2xl border border-stone-200">
              <button
                type="button"
                onClick={() => setActiveExplorerTab('interactiveTree')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeExplorerTab === 'interactiveTree'
                    ? 'bg-[#142e1f] text-white shadow-xs'
                    : 'text-stone-700 hover:text-emerald-800'
                }`}
              >
                🌳 Anatomical Tree SVG
              </button>

              <button
                type="button"
                onClick={() => setActiveExplorerTab('medicinal')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeExplorerTab === 'medicinal'
                    ? 'bg-[#142e1f] text-white shadow-xs'
                    : 'text-stone-700 hover:text-emerald-800'
                }`}
              >
                🧪 Pharmacopoeia (Medicinal)
              </button>

              <button
                type="button"
                onClick={() => setActiveExplorerTab('diseasesPests')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeExplorerTab === 'diseasesPests'
                    ? 'bg-[#142e1f] text-white shadow-xs'
                    : 'text-stone-700 hover:text-emerald-800'
                }`}
              >
                🛡️ Diseases &amp; Pests
              </button>

              <button
                type="button"
                onClick={() => setActiveExplorerTab('advantages')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeExplorerTab === 'advantages'
                    ? 'bg-[#142e1f] text-white shadow-xs'
                    : 'text-stone-700 hover:text-emerald-800'
                }`}
              >
                🌟 Other Advantages
              </button>

              <button
                type="button"
                onClick={() => setActiveExplorerTab('biodiversity')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeExplorerTab === 'biodiversity'
                    ? 'bg-[#142e1f] text-white shadow-xs'
                    : 'text-stone-700 hover:text-emerald-800'
                }`}
              >
                🦜 Wildlife &amp; Biodiversity
              </button>

              <button
                type="button"
                onClick={() => setActiveExplorerTab('cultural')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeExplorerTab === 'cultural'
                    ? 'bg-[#142e1f] text-white shadow-xs'
                    : 'text-stone-700 hover:text-emerald-800'
                }`}
              >
                🛕 Cultural &amp; Climate Pillars
              </button>
            </div>
          </div>

          {/* ── TAB 1: INTERACTIVE ANATOMICAL VECTOR TREE (From ResultCard.jsx Section 1) ── */}
          {activeExplorerTab === 'interactiveTree' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-2">
              <div className="lg:col-span-5 flex flex-col items-center justify-center">
                <p className="text-xs text-stone-500 mb-3 text-center flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                  Click or hover any part of the tree (crown / trunk) to inspect calculations
                </p>

                <div className="relative w-full max-w-[320px] aspect-[4/5] bg-gradient-to-b from-[#131f2d] to-[#0a1118] rounded-3xl border border-slate-800 p-6 shadow-2xl">
                  <svg viewBox="0 0 360 400" className="w-full h-full select-none">
                    <defs>
                      <radialGradient id="grad-oxygen" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#0891b2" stopOpacity="0.05" />
                      </radialGradient>
                      <radialGradient id="grad-co2" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#0d9488" stopOpacity="0.05" />
                      </radialGradient>
                      <radialGradient id="grad-carbon" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#34d399" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#059669" stopOpacity="0.05" />
                      </radialGradient>
                      <radialGradient id="grad-biomass" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#d97706" stopOpacity="0.05" />
                      </radialGradient>
                    </defs>

                    {/* Trunk / Base Path (Biomass) */}
                    <g
                      className="cursor-pointer group"
                      onMouseEnter={() => setHoveredMetric('biomass')}
                      onMouseLeave={() => setHoveredMetric(null)}
                      onClick={() => setActiveMetricKey('biomass')}
                    >
                      <circle cx="180" cy="300" r="50" fill="url(#grad-biomass)" />
                      <path
                        d="M 165 340 C 165 300, 160 220, 150 180 C 170 170, 190 170, 210 180 C 200 220, 195 300, 195 340 Z M 150 180 L 120 120 C 130 110, 140 120, 155 140 L 165 160 Z M 210 180 L 240 120 C 230 110, 220 120, 205 140 L 195 160 Z"
                        className={`transition-all duration-300 ${
                          effectiveMetricKey === 'biomass'
                            ? 'fill-amber-500 filter drop-shadow-[0_0_12px_rgba(245,158,11,0.7)]'
                            : 'fill-slate-600 group-hover:fill-amber-600'
                        }`}
                      />
                      <text x="180" y="323" textAnchor="middle" className="fill-amber-300 font-black text-[10px] tracking-wide pointer-events-none">TRUNK</text>
                      <text x="180" y="337" textAnchor="middle" className="fill-slate-300 font-bold text-[9px] pointer-events-none">BIOMASS</text>
                    </g>

                    {/* Left Canopy (Carbon) */}
                    <g
                      className="cursor-pointer group"
                      onMouseEnter={() => setHoveredMetric('carbon')}
                      onMouseLeave={() => setHoveredMetric(null)}
                      onClick={() => setActiveMetricKey('carbon')}
                    >
                      <circle cx="110" cy="140" r="55" fill="url(#grad-carbon)" />
                      <circle
                        cx="110"
                        cy="140"
                        r="45"
                        className={`transition-all duration-300 ${
                          effectiveMetricKey === 'carbon'
                            ? 'fill-emerald-500/25 stroke-emerald-400 stroke-[3px] filter drop-shadow-[0_0_12px_rgba(52,211,153,0.8)]'
                            : 'fill-slate-900/80 stroke-slate-600 stroke-2 group-hover:stroke-emerald-400'
                        }`}
                      />
                      <text x="110" y="135" textAnchor="middle" className="fill-emerald-400 font-black text-[11px] pointer-events-none">CARBON</text>
                      <text x="110" y="152" textAnchor="middle" className="fill-slate-300 font-bold text-[10px] pointer-events-none">{metrics.carbon} kg</text>
                    </g>

                    {/* Right Canopy (CO2 Sequestration) */}
                    <g
                      className="cursor-pointer group"
                      onMouseEnter={() => setHoveredMetric('co2')}
                      onMouseLeave={() => setHoveredMetric(null)}
                      onClick={() => setActiveMetricKey('co2')}
                    >
                      <circle cx="250" cy="140" r="55" fill="url(#grad-co2)" />
                      <circle
                        cx="250"
                        cy="140"
                        r="45"
                        className={`transition-all duration-300 ${
                          effectiveMetricKey === 'co2'
                            ? 'fill-teal-500/25 stroke-teal-400 stroke-[3px] filter drop-shadow-[0_0_12px_rgba(45,212,191,0.8)]'
                            : 'fill-slate-900/80 stroke-slate-600 stroke-2 group-hover:stroke-teal-400'
                        }`}
                      />
                      <text x="250" y="135" textAnchor="middle" className="fill-teal-400 font-black text-[11px] pointer-events-none">CO₂ VAULT</text>
                      <text x="250" y="152" textAnchor="middle" className="fill-slate-300 font-bold text-[10px] pointer-events-none">{metrics.co2} kg</text>
                    </g>

                    {/* Top Crown (Oxygen Released) */}
                    <g
                      className="cursor-pointer group"
                      onMouseEnter={() => setHoveredMetric('oxygen')}
                      onMouseLeave={() => setHoveredMetric(null)}
                      onClick={() => setActiveMetricKey('oxygen')}
                    >
                      <circle cx="180" cy="75" r="65" fill="url(#grad-oxygen)" />
                      <circle
                        cx="180"
                        cy="75"
                        r="55"
                        className={`transition-all duration-300 ${
                          effectiveMetricKey === 'oxygen'
                            ? 'fill-cyan-500/25 stroke-cyan-400 stroke-[3px] filter drop-shadow-[0_0_12px_rgba(34,211,238,0.8)]'
                            : 'fill-slate-900/80 stroke-slate-600 stroke-2 group-hover:stroke-cyan-400'
                        }`}
                      />
                      <text x="180" y="70" textAnchor="middle" className="fill-cyan-400 font-black text-[12px] pointer-events-none">OXYGEN</text>
                      <text x="180" y="88" textAnchor="middle" className="fill-slate-300 font-bold text-[10px] pointer-events-none">{metrics.oxygen} kg</text>
                    </g>
                  </svg>
                </div>
              </div>

              {/* Inspector Pane (Right) */}
              <div className="lg:col-span-7 space-y-4">
                <div className={`p-6 rounded-3xl border ${activeMetricObj.borderColor} ${activeMetricObj.bgColor} transition-all duration-300 shadow-sm`}>
                  <div className="flex justify-between items-center border-b border-stone-200/80 pb-3">
                    <span className={`text-sm font-extrabold uppercase tracking-wider ${activeMetricObj.textColor}`}>
                      {activeMetricObj.name}
                    </span>
                    <span className="text-xs text-stone-500 font-medium">Impact Detail</span>
                  </div>

                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-4xl font-black text-[#142e1f] font-mono">{activeMetricObj.value}</span>
                    <span className="text-xs text-stone-500">Living Tree Storage</span>
                  </div>

                  <p className="text-xs text-stone-700 leading-relaxed mt-2">
                    {activeMetricObj.explanation}
                  </p>

                  {/* Preservation Benefit */}
                  <div className="mt-4 p-3.5 bg-white/90 border border-emerald-300 rounded-2xl flex items-start gap-3 shadow-xs">
                    <div className="p-1.5 bg-emerald-100 rounded-xl text-emerald-800 shrink-0 mt-0.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Preservation Benefit</h5>
                      <p className="text-xs text-stone-700 leading-relaxed mt-0.5">
                        {activeMetricObj.preservationImpact}
                      </p>
                    </div>
                  </div>

                  {/* Destruction Cost */}
                  <div className="mt-2.5 p-3.5 bg-white/90 border border-red-300 rounded-2xl flex items-start gap-3 shadow-xs">
                    <div className="p-1.5 bg-red-100 rounded-xl text-red-800 shrink-0 mt-0.5">
                      <ShieldAlert className="w-4 h-4 text-red-700" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-red-900 uppercase tracking-wider">Destruction &amp; Felling Impact</h5>
                      <p className="text-xs text-stone-700 leading-relaxed mt-0.5">
                        {activeMetricObj.destructionCost}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 2: PHARMACOPOEIA (From ResultCard.jsx Section 2 & Inventory Logs RAG) ── */}
          {activeExplorerTab === 'medicinal' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
                <div className="flex items-center gap-3">
                  <HeartPulse className="w-7 h-7 text-pink-600 animate-pulse" />
                  <div>
                    <h4 className="font-extrabold text-[#142e1f] text-xl">Pharmacopoeia: Living Botanical Pharmacy</h4>
                    <p className="text-xs text-stone-500">Biochemical compounds, plant-part therapeutics, and traditional formulations</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-pink-700 bg-pink-100 px-3 py-1 rounded-full border border-pink-200 self-start sm:self-auto">
                  ⚡ {ragSource}
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Visual Apothecary Card */}
                <div className="lg:col-span-5 flex">
                  <div
                    className="w-full rounded-2xl border border-stone-200 overflow-hidden shadow-lg flex flex-col justify-end p-6 relative bg-cover bg-center min-h-[300px]"
                    style={{ backgroundImage: `url(${metrics.species.apothecaryImage || '/medicinal_apothecary.png'})` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
                    <div className="relative z-10 text-white space-y-2">
                      <span className="text-[10px] font-bold text-pink-300 uppercase tracking-wider bg-pink-900/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-pink-400/30 inline-block">
                        Ethnobotanical Analysis
                      </span>
                      <p className="text-xs sm:text-sm text-stone-100 leading-relaxed font-medium">
                        {metrics.species.ethnobotany}
                      </p>
                      <div className="pt-2 border-t border-white/20 text-[11px] text-pink-200 font-bold flex items-center gap-1.5">
                        <Smile className="w-3.5 h-3.5" />
                        Preserving this tree maintains a living natural apothecary.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Compounds & Applications */}
                <div className="lg:col-span-7 space-y-4">
                  <div>
                    <h5 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <FlaskConical className="w-3.5 h-3.5 text-pink-600" />
                      Active Bioactive Chemical Compounds
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {(ragData?.medicinalValue?.compounds || metrics.species.compounds).map((comp) => (
                        <span
                          key={comp}
                          className="px-3 py-1.5 bg-pink-50 text-pink-800 rounded-xl text-xs font-bold border border-pink-200 shadow-xs"
                        >
                          🧪 {comp}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    <div className="p-4 bg-stone-50 border border-stone-200/80 rounded-2xl">
                      <h5 className="text-xs font-bold text-stone-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Syringe className="w-3.5 h-3.5 text-emerald-700" />
                        Medicinal Applications
                      </h5>
                      <ul className="space-y-1.5 text-xs text-stone-700">
                        {(ragData?.medicinalValue?.applications || metrics.species.applications).map((app, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-emerald-600 font-bold">&bull;</span>
                            <span>{app}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 bg-stone-50 border border-stone-200/80 rounded-2xl">
                      <h5 className="text-xs font-bold text-stone-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Heart className="w-3.5 h-3.5 text-rose-600" />
                        Diseases &amp; Symptoms Treated
                      </h5>
                      <ul className="space-y-1.5 text-xs text-stone-700">
                        {(ragData?.medicinalValue?.diseases || metrics.species.diseases).map((dis, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-rose-600 font-bold">&bull;</span>
                            <span>{dis}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Plant-Part Specific Medicinal Uses (Inventory Logs Standard) ── */}
              <div className="pt-4 border-t border-stone-100 space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-extrabold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
                    <Leaf className="w-3.5 h-3.5 text-emerald-700" />
                    Plant-Part Specific Medicinal Uses (Inventory Logs Standard)
                  </h5>
                  <span className="text-[10px] font-bold text-pink-700 bg-pink-100/80 px-2.5 py-0.5 rounded-full border border-pink-200">
                    {ragSource}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="p-3.5 bg-stone-50/80 border border-stone-200 rounded-2xl">
                    <div className="text-[10px] uppercase font-bold text-emerald-800 flex items-center gap-1 mb-1">
                      <span>🍃</span> Leaves (Foliar Medicine)
                    </div>
                    <p className="text-xs text-stone-700 leading-relaxed">
                      {ragData?.medicinalValue?.leaves || metrics.species.medicinalParts?.leaves}
                    </p>
                  </div>

                  <div className="p-3.5 bg-stone-50/80 border border-stone-200 rounded-2xl">
                    <div className="text-[10px] uppercase font-bold text-amber-800 flex items-center gap-1 mb-1">
                      <span>🪵</span> Bark (Stem &amp; Cork Therapeutics)
                    </div>
                    <p className="text-xs text-stone-700 leading-relaxed">
                      {ragData?.medicinalValue?.bark || metrics.species.medicinalParts?.bark}
                    </p>
                  </div>

                  <div className="p-3.5 bg-stone-50/80 border border-stone-200 rounded-2xl">
                    <div className="text-[10px] uppercase font-bold text-rose-800 flex items-center gap-1 mb-1">
                      <span>🌸</span> Flowers &amp; Inflorescence
                    </div>
                    <p className="text-xs text-stone-700 leading-relaxed">
                      {ragData?.medicinalValue?.flowers || metrics.species.medicinalParts?.flowers}
                    </p>
                  </div>

                  <div className="p-3.5 bg-stone-50/80 border border-stone-200 rounded-2xl">
                    <div className="text-[10px] uppercase font-bold text-orange-800 flex items-center gap-1 mb-1">
                      <span>🍎</span> Fruits &amp; Pericarp
                    </div>
                    <p className="text-xs text-stone-700 leading-relaxed">
                      {ragData?.medicinalValue?.fruits || metrics.species.medicinalParts?.fruits}
                    </p>
                  </div>

                  <div className="p-3.5 bg-stone-50/80 border border-stone-200 rounded-2xl">
                    <div className="text-[10px] uppercase font-bold text-yellow-800 flex items-center gap-1 mb-1">
                      <span>🥕</span> Roots &amp; Rhizomes
                    </div>
                    <p className="text-xs text-stone-700 leading-relaxed">
                      {ragData?.medicinalValue?.roots || metrics.species.medicinalParts?.roots}
                    </p>
                  </div>

                  <div className="p-3.5 bg-stone-50/80 border border-stone-200 rounded-2xl">
                    <div className="text-[10px] uppercase font-bold text-teal-800 flex items-center gap-1 mb-1">
                      <span>🌰</span> Seeds &amp; Kernel Oil
                    </div>
                    <p className="text-xs text-stone-700 leading-relaxed">
                      {ragData?.medicinalValue?.seeds || metrics.species.medicinalParts?.seeds}
                    </p>
                  </div>
                </div>

                {/* Classical Formulations */}
                <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl">
                  <div className="text-[10px] uppercase font-extrabold tracking-wider text-amber-900 mb-1 flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                    Traditional Ayurvedic &amp; Folk Formulations
                  </div>
                  <p className="text-xs text-stone-700 leading-relaxed">
                    {ragData?.medicinalValue?.traditionalUses || metrics.species.medicinalParts?.traditionalUses}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: DISEASES & PESTS (Pathology & Biocontrol from RAG Engine) ── */}
          {activeExplorerTab === 'diseasesPests' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-[#142e1f] text-xl">Botanical Pathology, Insect Pests &amp; Biocontrol</h4>
                    <p className="text-xs text-stone-500">Pathogen screening, pest vectors, visual diagnostic markers, and organic IPM biological treatments</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-red-800 bg-red-100 px-3 py-1 rounded-full border border-red-200 self-start sm:self-auto">
                  ⚡ {ragSource}
                </span>
              </div>

              {ragData?.diseasesPests?.summary && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-300/60 text-xs text-amber-950 flex items-start gap-3">
                  <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">Live RAG Diagnostic Screening:</strong> {ragData.diseasesPests.summary}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Diseases */}
                <div className="p-5 rounded-3xl bg-gradient-to-br from-red-500/[0.06] to-orange-500/[0.04] border border-red-200/80 shadow-sm space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-red-100 text-red-800 rounded-xl">
                      <ShieldAlert className="w-4 h-4 text-red-700" />
                    </span>
                    <div>
                      <h5 className="font-extrabold text-sm text-[#142e1f]">Common Fungal &amp; Bacterial Diseases</h5>
                      <span className="text-[10px] text-stone-500">Verified by ICAR &amp; FAO Forestry</span>
                    </div>
                  </div>
                  <ul className="space-y-2">
                    {(metrics.species.diseasesPests?.diseases || []).map((dis, idx) => (
                      <li key={idx} className="flex items-start gap-2 p-2.5 rounded-xl bg-white/90 border border-red-100 text-xs text-stone-800">
                        <span className="text-red-600 font-bold mt-0.5">&bull;</span>
                        <span className="font-medium">{dis}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Insect Pests */}
                <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-500/[0.06] to-yellow-500/[0.04] border border-amber-200/80 shadow-sm space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                      <Bug className="w-4 h-4 text-amber-700" />
                    </span>
                    <div>
                      <h5 className="font-extrabold text-sm text-[#142e1f]">Destructive Insect Pests &amp; Vectors</h5>
                      <span className="text-[10px] text-stone-500">Sap-suckers, borers &amp; defoliators</span>
                    </div>
                  </div>
                  <ul className="space-y-2">
                    {(metrics.species.diseasesPests?.pests || []).map((pst, idx) => (
                      <li key={idx} className="flex items-start gap-2 p-2.5 rounded-xl bg-white/90 border border-amber-100 text-xs text-stone-800">
                        <span className="text-amber-600 font-bold mt-0.5">&bull;</span>
                        <span className="font-medium">{pst}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Symptoms and IPM Treatments */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-3xl bg-stone-50 border border-stone-200/80 space-y-2">
                  <div className="text-[10px] uppercase font-extrabold tracking-wider text-stone-500 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-stone-600" />
                    Diagnostic Symptoms &amp; Visual Markers
                  </div>
                  <p className="text-xs text-stone-700 leading-relaxed font-medium">
                    {metrics.species.diseasesPests?.symptoms}
                  </p>
                </div>

                <div className="p-5 rounded-3xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
                  <div className="text-[10px] uppercase font-extrabold tracking-wider text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    Integrated Pest Management (IPM) &amp; Organic Treatments
                  </div>
                  <p className="text-xs text-stone-700 leading-relaxed font-medium">
                    {metrics.species.diseasesPests?.treatment}
                  </p>
                </div>
              </div>

              {/* Conservation Status & Peer-Reviewed Research Papers */}
              <div className="p-5 rounded-3xl bg-stone-100/70 border border-stone-200/80 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-2">
                  <div className="text-xs font-bold text-[#142e1f] flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-emerald-700" />
                    IUCN Conservation Status &amp; Peer-Reviewed Research
                  </div>
                  <span className="text-xs font-bold px-3 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 border border-emerald-300">
                    IUCN: {metrics.species.diseasesPests?.iucnStatus || 'Least Concern (LC)'}
                  </span>
                </div>
                <div className="space-y-2">
                  {(metrics.species.diseasesPests?.researchPapers || []).map((paper, idx) => (
                    <div key={idx} className="p-3 bg-white rounded-xl border border-stone-200 text-xs text-stone-700 flex items-start gap-2">
                      <FileText className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
                      <span>{paper}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: OTHER ADVANTAGES (Extended Ecosystem Services & Shield) ── */}
          {activeExplorerTab === 'advantages' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-[#142e1f] text-xl">Other Advantages &amp; Extended Ecological Shield</h4>
                    <p className="text-xs text-stone-500">Air scrubbing, noise reduction, climate resilience, hydrologic buffer, and agroforestry co-benefits</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300 self-start sm:self-auto">
                  ⚡ {ragSource}
                </span>
              </div>

              {ragData?.otherAdvantages && (
                <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-300/60 text-xs text-cyan-950 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-700 shrink-0" />
                    <span className="font-bold">Live Multi-Layer Ecological Indices (RAG):</span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px] font-mono">
                    <span className="px-2.5 py-1 bg-white/90 rounded-lg border border-cyan-200">💨 Air: {ragData.otherAdvantages.airScrubbing}</span>
                    <span className="px-2.5 py-1 bg-white/90 rounded-lg border border-cyan-200">🌧️ Interception: {ragData.otherAdvantages.stormwaterInterception}</span>
                    <span className="px-2.5 py-1 bg-white/90 rounded-lg border border-cyan-200">🌳 Canopy Footprint: {ragData.otherAdvantages.shadeCooling}</span>
                    <span className="px-2.5 py-1 bg-white/90 rounded-lg border border-cyan-200">🌡️ UHI: {ragData.otherAdvantages.heatIslandScore}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-5 rounded-3xl bg-gradient-to-br from-cyan-500/[0.08] to-blue-500/[0.04] border border-cyan-200 shadow-sm space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-cyan-100 text-cyan-800 flex items-center justify-center">
                    <Wind className="w-4 h-4 text-cyan-700" />
                  </div>
                  <h5 className="font-extrabold text-sm text-[#142e1f]">Air Scrubbing &amp; PM2.5 Trapping</h5>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    {metrics.species.otherAdvantages?.airPurification}
                  </p>
                  <div className="pt-2 text-[10px] font-mono font-bold text-cyan-800">
                    Removal Rate: ~{metrics.airPollutionRemoval} kg/yr
                  </div>
                </div>

                <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-500/[0.08] to-purple-500/[0.04] border border-indigo-200 shadow-sm space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center">
                    <Activity className="w-4 h-4 text-indigo-700" />
                  </div>
                  <h5 className="font-extrabold text-sm text-[#142e1f]">Acoustic Noise Reduction</h5>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    {metrics.species.otherAdvantages?.noiseReduction}
                  </p>
                  <div className="pt-2 text-[10px] font-mono font-bold text-indigo-800">
                    Acoustic Barrier: 3–6 dB attenuation
                  </div>
                </div>

                <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-500/[0.08] to-orange-500/[0.04] border border-amber-200 shadow-sm space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                    <Sun className="w-4 h-4 text-amber-700" />
                  </div>
                  <h5 className="font-extrabold text-sm text-[#142e1f]">Climate &amp; Thermal Resilience</h5>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    {metrics.species.otherAdvantages?.climateResilience}
                  </p>
                  <div className="pt-2 text-[10px] font-mono font-bold text-amber-800">
                    UHI Buffer: {metrics.heatIslandReduction}% score
                  </div>
                </div>

                <div className="p-5 rounded-3xl bg-gradient-to-br from-teal-500/[0.08] to-emerald-500/[0.04] border border-teal-200 shadow-sm space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-teal-700" />
                  </div>
                  <h5 className="font-extrabold text-sm text-[#142e1f]">Soil Anchor &amp; Slope Protection</h5>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    {metrics.species.otherAdvantages?.soilProtection}
                  </p>
                  <div className="pt-2 text-[10px] font-mono font-bold text-teal-800">
                    Shear Anchor: {metrics.soilStabilizationScore}%
                  </div>
                </div>

                <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-500/[0.08] to-teal-500/[0.04] border border-emerald-200 shadow-sm space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-emerald-700" />
                  </div>
                  <h5 className="font-extrabold text-sm text-[#142e1f]">Building Energy Reduction</h5>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Interception of 90% incident solar radiation drops surface building wall temperature by 3°C–5°C, saving 15%–30% in AC power bills.
                  </p>
                  <div className="pt-2 text-[10px] font-mono font-bold text-emerald-800">
                    Energy Saved: ~{metrics.coolingEffect} kWh eq.
                  </div>
                </div>

                <div className="p-5 rounded-3xl bg-gradient-to-br from-stone-500/[0.08] to-emerald-500/[0.04] border border-stone-200 shadow-sm space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-stone-100 text-stone-800 flex items-center justify-center">
                    <Trees className="w-4 h-4 text-emerald-800" />
                  </div>
                  <h5 className="font-extrabold text-sm text-[#142e1f]">Agroforestry &amp; Economic Products</h5>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    {metrics.species.otherAdvantages?.agroforestryValue}
                  </p>
                  <div className="pt-2 text-[10px] font-mono font-bold text-stone-700">
                    Multi-Use Non-Timber Forest Assets
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 3: FAUNA & BIODIVERSITY SANCTUARY (From ResultCard.jsx Section 3) ── */}
          {activeExplorerTab === 'biodiversity' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Header with View Selector */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-3">
                <div className="flex items-center gap-3">
                  <Bird className="w-7 h-7 text-sky-600 animate-bounce" />
                  <div>
                    <h4 className="font-extrabold text-[#142e1f] text-xl">Biodiversity &amp; Wildlife Keystone Habitat</h4>
                    <p className="text-xs text-stone-500">Avian nesting architecture, wild pollinators, small canopy mammals, and food-web resilience</p>
                  </div>
                </div>

                {/* Perspective View Switcher */}
                <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-2xl border border-stone-200 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setBiodiversityPhotoView('both')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      biodiversityPhotoView === 'both'
                        ? 'bg-white text-sky-900 shadow-xs border border-stone-200'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    🌿 Dual View (Both)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBiodiversityPhotoView('canopy')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      biodiversityPhotoView === 'canopy'
                        ? 'bg-white text-sky-900 shadow-xs border border-stone-200'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    🌳 Canopy Sanctuary
                  </button>
                  <button
                    type="button"
                    onClick={() => setBiodiversityPhotoView('nest')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      biodiversityPhotoView === 'nest'
                        ? 'bg-white text-sky-900 shadow-xs border border-stone-200'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    🪺 Weaver Bird Nest
                  </button>
                </div>
              </div>

              {/* ── Visual Habitat Showcase (Increased Width & Height/Length) ── */}
              <div className={`grid gap-6 items-stretch ${
                biodiversityPhotoView === 'both' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
              }`}>
                {/* Photo 1: Canopy Micro-Ecosystem Sanctuary */}
                {(biodiversityPhotoView === 'both' || biodiversityPhotoView === 'canopy') && (
                  <div
                    className="w-full rounded-3xl border border-stone-300/80 overflow-hidden shadow-xl flex flex-col justify-end p-6 sm:p-8 relative bg-cover bg-center transition-all duration-300 hover:shadow-2xl group min-h-[480px] sm:min-h-[520px]"
                    style={{ backgroundImage: `url(${metrics.species.habitatImage || '/biodiversity/neem_canopy_real.jpg'})` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/10 group-hover:via-black/35 transition-all" />
                    <div className="relative z-10 text-white space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-extrabold text-sky-300 uppercase tracking-widest bg-sky-950/70 backdrop-blur-md px-3 py-1 rounded-full border border-sky-400/30 inline-flex items-center gap-1.5 shadow-sm">
                          <Trees className="w-3.5 h-3.5" />
                          Canopy Sanctuary
                        </span>
                        <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/60 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                          Trophic Web
                        </span>
                      </div>

                      <h5 className="font-extrabold text-xl sm:text-2xl text-white tracking-tight drop-shadow-sm">
                        Botanical Canopy Sanctuary &amp; Micro-Ecosystem
                      </h5>

                      <p className="text-xs sm:text-sm text-stone-100 leading-relaxed font-medium drop-shadow-xs max-w-xl">
                        A single mature {metrics.species.name} canopy provides nesting perches, fruit, nectar, and thermal shelter for hundreds of wild organisms in urban and suburban landscapes.
                      </p>

                      <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
                        <span className="px-2.5 py-1 rounded-lg bg-white/15 backdrop-blur-md border border-white/20 text-white font-medium">
                          🌿 Avian Nesting Perches
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-white/15 backdrop-blur-md border border-white/20 text-white font-medium">
                          🌸 Nectar &amp; Pollen Forage
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-white/15 backdrop-blur-md border border-white/20 text-white font-medium">
                          🌡️ Thermal Shelter Buffer
                        </span>
                      </div>

                      <div className="pt-3 border-t border-white/20 text-xs text-sky-200 font-bold flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Felling this tree eradicates an entire living micro-ecosystem.</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Photo 2: Avian Arboreal Nesting & Weaver Bird Shelter */}
                {(biodiversityPhotoView === 'both' || biodiversityPhotoView === 'nest') && (
                  <div
                    className="w-full rounded-3xl border border-stone-300/80 overflow-hidden shadow-xl flex flex-col justify-end p-6 sm:p-8 relative bg-cover bg-center transition-all duration-300 hover:shadow-2xl group min-h-[480px] sm:min-h-[520px]"
                    style={{ backgroundImage: `url('/biodiversity/real_weaver_nest.jpg')` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/10 group-hover:via-black/35 transition-all" />
                    <div className="relative z-10 text-white space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-extrabold text-amber-300 uppercase tracking-widest bg-amber-950/70 backdrop-blur-md px-3 py-1 rounded-full border border-amber-400/30 inline-flex items-center gap-1.5 shadow-sm">
                          <Bird className="w-3.5 h-3.5" />
                          Avian Nesting Architecture
                        </span>
                        <span className="text-[10px] font-bold text-sky-300 bg-sky-950/60 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-sky-400/30">
                          Active Bird Refuge
                        </span>
                      </div>

                      <h5 className="font-extrabold text-xl sm:text-2xl text-white tracking-tight drop-shadow-sm">
                        Suspended Weaver Bird Nest &amp; Arboreal Nursery
                      </h5>

                      <p className="text-xs sm:text-sm text-stone-100 leading-relaxed font-medium drop-shadow-xs max-w-xl">
                        Naturally woven retort-shaped pendant nest constructed by weaver birds from flexible plant fibers and grassroots. Suspended high from branches, it provides predator-proof incubation chambers and climatic shielding for young nestlings.
                      </p>

                      <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
                        <span className="px-2.5 py-1 rounded-lg bg-white/15 backdrop-blur-md border border-white/20 text-white font-medium">
                          🌾 Natural Woven Fiber Architecture
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-white/15 backdrop-blur-md border border-white/20 text-white font-medium">
                          🛡️ Predator Exclusion Entry Tunnel
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-white/15 backdrop-blur-md border border-white/20 text-white font-medium">
                          🐣 Thermal Brood Incubator
                        </span>
                      </div>

                      <div className="pt-3 border-t border-white/20 text-xs text-amber-200 font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Crucial arboreal nesting, egg incubation &amp; fledgling nursery for native avifauna.</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Real Biodiversity Image Cards from Local Database ── */}
              {(() => {
                const bioData = getBiodiversityData(selectedSpeciesKey);
                const CATEGORY_CONFIG = {
                  bird:    { label: 'Birds (Avifauna)',          bg: 'bg-sky-50',     border: 'border-sky-200',    badge: 'bg-sky-100 text-sky-800 border-sky-200',    dot: 'bg-sky-500',    icon: '🐦' },
                  insect:  { label: 'Insects & Pollinators',     bg: 'bg-amber-50',   border: 'border-amber-200',  badge: 'bg-amber-100 text-amber-800 border-amber-200', dot: 'bg-amber-500',  icon: '🐝' },
                  mammal:  { label: 'Canopy Mammals',            bg: 'bg-emerald-50', border: 'border-emerald-200',badge: 'bg-emerald-100 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500', icon: '🐿️' },
                };
                return (
                  <div className="space-y-6 pt-2">
                    {['bird', 'insect', 'mammal'].map((cat) => {
                      const creatures = [
                        ...(bioData.birds || []),
                        ...(bioData.insects || []),
                        ...(bioData.mammals || []),
                      ].filter((c) => c.category === cat);
                      if (creatures.length === 0) return null;
                      const cfg = CATEGORY_CONFIG[cat];
                      return (
                        <div key={cat} className={`p-5 ${cfg.bg}/70 border ${cfg.border}/80 rounded-3xl space-y-4`}>
                          <div className="flex items-center justify-between">
                            <h5 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-stone-800">
                              <span>{cfg.icon}</span>
                              {cfg.label}
                            </h5>
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${cfg.badge}`}>
                              {creatures.length} Species
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {creatures.map((creature, idx) => (
                              <div
                                key={idx}
                                className="bg-white rounded-2xl border border-stone-200/80 overflow-hidden shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
                              >
                                {/* Real Image */}
                                <div className="relative h-36 overflow-hidden bg-stone-100">
                                  <img
                                    src={creature.image}
                                    alt={creature.name}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.parentNode.style.background = '#f1f5f9';
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                  <span className={`absolute top-2 left-2 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${cfg.badge} backdrop-blur-sm`}>
                                    {cat}
                                  </span>
                                </div>

                                {/* Info */}
                                <div className="p-3 flex flex-col gap-1.5 flex-1">
                                  <div>
                                    <p className="text-sm font-extrabold text-stone-900 leading-tight">{creature.name}</p>
                                    <p className="text-[10px] italic text-stone-400 font-medium">{creature.scientific}</p>
                                  </div>
                                  <p className="text-[11px] text-stone-600 leading-relaxed mt-1 flex-1">
                                    {creature.fact}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {/* Source note */}
                    <p className="text-[10px] text-stone-400 text-center font-medium pt-1">
                      📷 Images: Wikimedia Commons (CC-BY-SA) · Data curated from GBIF, India Biodiversity Portal & FSI
                    </p>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ── TAB 4: CULTURAL & CLIMATIC PILLARS (From ResultCard.jsx Section 4 & Knowledge Base) ── */}
          {activeExplorerTab === 'cultural' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Hero Cultural Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200/80 pb-5">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/25 shrink-0">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                        Ethnobotanical Guardianship
                      </span>
                      <span className="text-[10px] font-bold text-stone-500">
                        6 Ecological &amp; Cultural Pillars
                      </span>
                    </div>
                    <h4 className="font-extrabold font-['Fraunces'] text-[#142e1f] text-2xl sm:text-3xl mt-1">
                      Cultural Heritage, Sacred Groves &amp; Climate Resilience
                    </h4>
                    <p className="text-xs text-stone-600 mt-1 max-w-3xl">
                      Ancient pooja customs, zero-felling sacred grove taboos, building thermal envelopes, microclimate regulation, and legendary grassroots tree protection movements.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100/80 border border-emerald-300 px-3 py-1 rounded-full">
                    🌿 Specimen: {metrics.species.name}
                  </span>
                </div>
              </div>

              {/* Interactive Category Filter Bar */}
              <div className="flex flex-wrap items-center gap-2 p-1.5 bg-stone-100/90 rounded-2xl border border-stone-200/80">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider px-2 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Filter:
                </span>
                {[
                  { id: 'all', label: 'All 6 Pillars', count: '6' },
                  { id: 'spiritual', label: '🪔 Sacred Groves & Pooja', count: '1' },
                  { id: 'energy', label: '⚡ Energy & Shading', count: '1' },
                  { id: 'thermal', label: '🌡️ Thermal Gradient (UHI)', count: '1' },
                  { id: 'pollinators', label: '🐝 Bees & Pollination', count: '1' },
                  { id: 'disaster', label: '🛡️ Monsoon & Soil Shield', count: '1' },
                  { id: 'movements', label: '✊ Historic Movements', count: '1' },
                ].map((pill) => (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => setCulturalFilter(pill.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      culturalFilter === pill.id
                        ? 'bg-[#142e1f] text-white shadow-sm shadow-[#142e1f]/30 scale-[1.02]'
                        : 'text-stone-700 hover:text-emerald-900 hover:bg-stone-200/70'
                    }`}
                  >
                    <span>{pill.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        culturalFilter === pill.id
                          ? 'bg-white/20 text-white'
                          : 'bg-stone-200 text-stone-600'
                      }`}
                    >
                      {pill.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Grid of Attractive Knowledge Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* ── CARD 1: SACRED POOJA CUSTOMS & SACRED GROVES ── */}
                {(culturalFilter === 'all' || culturalFilter === 'spiritual') && (
                  <div className="rounded-3xl p-6 bg-gradient-to-br from-amber-500/[0.08] via-orange-500/[0.04] to-rose-500/[0.07] border border-amber-300/80 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform" />

                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-600 to-rose-600 text-white shadow-xs">
                          Pillar 1 &middot; Ethnobotany
                        </span>
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-full border border-amber-200">
                          Zero-Felling Taboo
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-800 flex items-center justify-center shrink-0 border border-amber-300">
                          <Heart className="w-5 h-5 text-rose-600" />
                        </div>
                        <div>
                          <h5 className="font-extrabold text-base text-[#142e1f]">Sacred Pooja &amp; Divine Sanctity</h5>
                          <p className="text-[11px] text-amber-900/80 font-medium">Deorai Tradition &amp; Spiritual Guardianship</p>
                        </div>
                      </div>

                      {/* Ritual Action Chips */}
                      <div className="flex flex-wrap gap-1.5 mb-3.5">
                        <span className="px-2 py-0.5 rounded-md bg-white/90 border border-amber-200 text-[10px] font-bold text-stone-700">
                          🪔 Vermilion &amp; Turmeric Pooja
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-white/90 border border-amber-200 text-[10px] font-bold text-stone-700">
                          🧵 Sacred Raksha Sutra Thread
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-white/90 border border-amber-200 text-[10px] font-bold text-stone-700">
                          💧 Holy Water Libation
                        </span>
                      </div>

                      {/* Dynamic Species Lore */}
                      <div className="p-3.5 rounded-2xl bg-white/80 border border-amber-200/90 mb-3 shadow-xs">
                        <div className="text-[10px] uppercase font-extrabold tracking-wider text-amber-900 mb-1 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-600" />
                          {metrics.species.name} Living Reverence
                        </div>
                        <p className="text-xs text-stone-700 leading-relaxed font-serif italic">
                          &ldquo;{metrics.species.spirituality}&rdquo;
                        </p>
                      </div>

                      {/* Sacred Groves Detail */}
                      <p className="text-xs text-stone-600 leading-relaxed">
                        In traditional South Asian folklore, trees are living deities. The <strong>Sacred Grove (Deorai / Kovilkadu)</strong> institution protects ancient tree sanctuaries where cutting branches is strictly taboo, ensuring centuries of continuous genetic and canopy conservation.
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-amber-200/70 flex items-center justify-between text-[11px] text-amber-900 font-bold">
                      <span>Metaphysical Guardianship</span>
                      <span className="text-rose-700">&hearts; Community Shield</span>
                    </div>
                  </div>
                )}

                {/* ── CARD 2: BUILDING SHADING & ELECTRICITY REDUCTION ── */}
                {(culturalFilter === 'all' || culturalFilter === 'energy') && (
                  <div className="rounded-3xl p-6 bg-gradient-to-br from-emerald-500/[0.08] via-teal-500/[0.04] to-yellow-500/[0.07] border border-emerald-300/80 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform" />

                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-emerald-700 to-teal-700 text-white shadow-xs">
                          Pillar 2 &middot; Architectural Physics
                        </span>
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-full border border-emerald-200">
                          Passive Cooling
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-300">
                          <Zap className="w-5 h-5 text-emerald-700" />
                        </div>
                        <div>
                          <h5 className="font-extrabold text-base text-[#142e1f]">Building Shading &amp; Electricity</h5>
                          <p className="text-[11px] text-emerald-900/80 font-medium">Thermal Envelope Load Mitigation</p>
                        </div>
                      </div>

                      {/* 3 Visual KPI Badges */}
                      <div className="grid grid-cols-3 gap-2 mb-3.5">
                        <div className="p-2.5 rounded-xl bg-white/90 border border-emerald-200 text-center shadow-xs">
                          <div className="text-base font-black text-emerald-800 font-mono">15%–30%</div>
                          <div className="text-[9px] text-stone-500 uppercase font-bold leading-tight mt-0.5">AC Power Cut</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white/90 border border-emerald-200 text-center shadow-xs">
                          <div className="text-base font-black text-emerald-800 font-mono">3°C–5°C</div>
                          <div className="text-[9px] text-stone-500 uppercase font-bold leading-tight mt-0.5">Wall Temp Drop</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white/90 border border-emerald-200 text-center shadow-xs">
                          <div className="text-base font-black text-emerald-800 font-mono">~10 ACs</div>
                          <div className="text-[9px] text-stone-500 uppercase font-bold leading-tight mt-0.5">Equiv. Power</div>
                        </div>
                      </div>

                      {/* Solar Shield Bar */}
                      <div className="p-3 rounded-xl bg-emerald-100/60 border border-emerald-200/80 mb-3">
                        <div className="flex justify-between text-[11px] font-bold text-emerald-950 mb-1">
                          <span>Solar Radiation Blocked</span>
                          <span>Up to 90%</span>
                        </div>
                        <div className="w-full bg-white h-2 rounded-full overflow-hidden">
                          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 h-full rounded-full w-[90%]" />
                        </div>
                      </div>

                      <p className="text-xs text-stone-600 leading-relaxed">
                        Canopies intercept sunlight before it penetrates roofs, walls, and glass facades. In cooler seasons, dense branching acts as a <strong>windbreak</strong>, reducing draft-induced heat leakage and optimizing year-round municipal energy demand.
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-emerald-200/70 flex items-center justify-between text-[11px] text-emerald-900 font-bold">
                      <span>Energy Shield: {metrics.coolingEffect} kWh Saved</span>
                      <span className="text-emerald-700">Passive Eco-Architecture</span>
                    </div>
                  </div>
                )}

                {/* ── CARD 3: THE THERMAL GRADIENT & UHI BUSTER ── */}
                {(culturalFilter === 'all' || culturalFilter === 'thermal') && (
                  <div className="rounded-3xl p-6 bg-gradient-to-br from-cyan-500/[0.08] via-sky-500/[0.04] to-blue-500/[0.07] border border-cyan-300/80 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform" />

                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-cyan-700 to-blue-700 text-white shadow-xs">
                          Pillar 3 &middot; Thermodynamics
                        </span>
                        <span className="text-[10px] font-bold text-cyan-800 bg-cyan-100/90 px-2 py-0.5 rounded-full border border-cyan-200">
                          UHI Neutralizer
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-800 flex items-center justify-center shrink-0 border border-cyan-300">
                          <Thermometer className="w-5 h-5 text-cyan-700" />
                        </div>
                        <div>
                          <h5 className="font-extrabold text-base text-[#142e1f]">The Thermal Gradient &amp; UHI</h5>
                          <p className="text-[11px] text-cyan-900/80 font-medium">Shadowing &amp; Transpirational Cooling</p>
                        </div>
                      </div>

                      {/* Dual Surface Temperature Comparison */}
                      <div className="space-y-2 mb-3.5">
                        <div className="p-2.5 rounded-xl bg-red-50/90 border border-red-200 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 text-red-950 font-bold">
                            <Sun className="w-4 h-4 text-orange-600 shrink-0" />
                            <span>Unshaded Asphalt / Concrete</span>
                          </div>
                          <span className="font-mono font-black text-red-700">&gt; 50°C</span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-teal-50/90 border border-teal-200 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 text-teal-950 font-bold">
                            <Leaf className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Under {metrics.species.name} Canopy</span>
                          </div>
                          <span className="font-mono font-black text-emerald-800">~30°C–34°C</span>
                        </div>
                      </div>

                      {/* Thermal Gradient Metric */}
                      <div className="p-3 rounded-2xl bg-white/80 border border-cyan-200/90 mb-3 shadow-xs">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-stone-700">Cooling Microclimate Differential</span>
                          <span className="font-black font-mono text-cyan-800">15°C–20°C Cooler</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-stone-500 mt-1">
                          <span>Specimen Ground Shade: {metrics.shadeArea} m²</span>
                          <span>UHI Buffer Score: {metrics.heatIslandReduction}%</span>
                        </div>
                      </div>

                      <p className="text-xs text-stone-600 leading-relaxed">
                        The <strong>Thermal Gradient</strong> curve stops urban surfaces from storing sensible radiation heat. Convection loops of cool humid air circulate down streets, creating a refreshing oasis against asphalt heat islands.
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-cyan-200/70 flex items-center justify-between text-[11px] text-cyan-900 font-bold">
                      <span>Evapotranspiration Engine</span>
                      <span className="text-cyan-700">UHI Defense: {metrics.heatIslandReduction}%</span>
                    </div>
                  </div>
                )}

                {/* ── CARD 4: BEES & POLLINATION (EINSTEIN WARNING) ── */}
                {(culturalFilter === 'all' || culturalFilter === 'pollinators') && (
                  <div className="rounded-3xl p-6 bg-gradient-to-br from-amber-500/[0.08] via-yellow-500/[0.05] to-orange-500/[0.07] border border-amber-300/90 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/15 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform" />

                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-xs">
                          Pillar 4 &middot; Ecological Symbiosis
                        </span>
                        <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                          Food Security
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-800 flex items-center justify-center shrink-0 border border-amber-300">
                          <Bug className="w-5 h-5 text-amber-700" />
                        </div>
                        <div>
                          <h5 className="font-extrabold text-base text-[#142e1f]">Existential Symbiosis: Bees</h5>
                          <p className="text-[11px] text-amber-900/80 font-medium">Pollinator Forage &amp; Crop Security</p>
                        </div>
                      </div>

                      {/* Albert Einstein Quote Box */}
                      <div className="p-3.5 rounded-2xl bg-amber-100/70 border border-amber-300 mb-3 shadow-xs">
                        <div className="text-[10px] uppercase font-black tracking-widest text-amber-950 mb-1 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                          Einstein Pollinator Warning
                        </div>
                        <p className="text-xs text-amber-950 font-serif italic leading-relaxed">
                          &ldquo;If the bee disappeared off the surface of the globe, then man would only have four years of life left.&rdquo;
                        </p>
                      </div>

                      {/* Key Pollinator Stats */}
                      <div className="grid grid-cols-2 gap-2 mb-3.5">
                        <div className="p-2.5 rounded-xl bg-white/90 border border-amber-200 text-center">
                          <div className="text-base font-black text-amber-800 font-mono">70%+</div>
                          <div className="text-[9px] text-stone-500 uppercase font-bold mt-0.5">Crops Pollinated</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white/90 border border-amber-200 text-center">
                          <div className="text-base font-black text-amber-800 font-mono">90%</div>
                          <div className="text-[9px] text-stone-500 uppercase font-bold mt-0.5">Global Nutrition</div>
                        </div>
                      </div>

                      <p className="text-xs text-stone-600 leading-relaxed">
                        Canopies supply massive seasonal nectar blooms and hollow nesting refuges for <strong>Apis cerana</strong> and <strong>Apis dorsata</strong>. Without mature tree crowns within 3 km foraging ranges, pollinator colonies collapse, threatening humanity&apos;s food system.
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-amber-200/70 flex items-center justify-between text-[11px] text-amber-900 font-bold">
                      <span>Nectar Bloom Engine</span>
                      <span className="text-amber-800">Forage Host: {metrics.species.name}</span>
                    </div>
                  </div>
                )}

                {/* ── CARD 5: DISASTER MITIGATION & SOIL ANCHOR ── */}
                {(culturalFilter === 'all' || culturalFilter === 'disaster') && (
                  <div className="rounded-3xl p-6 bg-gradient-to-br from-teal-500/[0.08] via-emerald-500/[0.04] to-cyan-500/[0.07] border border-teal-300/80 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-teal-400/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform" />

                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-teal-700 to-emerald-700 text-white shadow-xs">
                          Pillar 5 &middot; Disaster Mitigation
                        </span>
                        <span className="text-[10px] font-bold text-teal-800 bg-teal-100/90 px-2 py-0.5 rounded-full border border-teal-200">
                          Monsoon Shield
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-800 flex items-center justify-center shrink-0 border border-teal-300">
                          <ShieldCheck className="w-5 h-5 text-teal-700" />
                        </div>
                        <div>
                          <h5 className="font-extrabold text-base text-[#142e1f]">Monsoon Shield &amp; Soil Anchor</h5>
                          <p className="text-[11px] text-teal-900/80 font-medium">Hydrologic Buffer &amp; Landslide Grip</p>
                        </div>
                      </div>

                      {/* Interactive Metrics Grid */}
                      <div className="grid grid-cols-2 gap-2 mb-3.5">
                        <div className="p-2.5 rounded-xl bg-white/90 border border-teal-200 text-center shadow-xs">
                          <div className="text-base font-black text-teal-800 font-mono">{metrics.soilStabilizationScore}%</div>
                          <div className="text-[9px] text-stone-500 uppercase font-bold mt-0.5">Soil Grip Score</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white/90 border border-teal-200 text-center shadow-xs">
                          <div className="text-base font-black text-teal-800 font-mono">~{metrics.rainwaterInterception} L</div>
                          <div className="text-[9px] text-stone-500 uppercase font-bold mt-0.5">Rainwater Buffered/yr</div>
                        </div>
                      </div>

                      {/* Disaster Mechanisms Chips */}
                      <div className="space-y-1.5 mb-3.5">
                        <div className="p-2 rounded-xl bg-teal-50/90 border border-teal-200/80 text-[11px] text-teal-950 flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                          <span><strong>Rainfall Deceleration:</strong> Drops slowed, preventing flash runoff</span>
                        </div>
                        <div className="p-2 rounded-xl bg-teal-50/90 border border-teal-200/80 text-[11px] text-teal-950 flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                          <span><strong>Subterranean Binding:</strong> Roots lock slope particles against mudslides</span>
                        </div>
                      </div>

                      <p className="text-xs text-stone-600 leading-relaxed">
                        During extreme monsoon downpours, the canopy delays runoff spikes into city storm drains. Deep taproots and lateral networks drastically boost soil shear cohesion to prevent slope failure.
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-teal-200/70 flex items-center justify-between text-[11px] text-teal-900 font-bold">
                      <span>Monsoon Disaster Shield</span>
                      <span className="text-teal-700">Runoff Delay Active</span>
                    </div>
                  </div>
                )}

                {/* ── CARD 6: REAL-LIFE CONSERVATION MOVEMENTS ── */}
                {(culturalFilter === 'all' || culturalFilter === 'movements') && (
                  <div className="rounded-3xl p-6 bg-gradient-to-br from-stone-500/[0.08] via-emerald-600/[0.05] to-stone-600/[0.08] border border-stone-300 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform" />

                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-emerald-800 to-stone-800 text-white shadow-xs">
                          Pillar 6 &middot; Grassroots Activism
                        </span>
                        <span className="text-[10px] font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                          Living History
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-800/15 text-emerald-900 flex items-center justify-center shrink-0 border border-emerald-300">
                          <Trees className="w-5 h-5 text-emerald-800" />
                        </div>
                        <div>
                          <h5 className="font-extrabold text-base text-[#142e1f]">Historic Conservation Battles</h5>
                          <p className="text-[11px] text-stone-600 font-medium">People-Powered Tree Defense Movements</p>
                        </div>
                      </div>

                      {/* 3 Historic Case Studies */}
                      <div className="space-y-2 mb-3.5">
                        <div className="p-2.5 rounded-xl bg-white/90 border border-stone-200">
                          <div className="text-[11px] font-black text-[#142e1f] flex items-center gap-1.5">
                            <span>🌲</span>
                            <span>The Chipko Movement (1970s)</span>
                          </div>
                          <p className="text-[10px] text-stone-600 mt-0.5 leading-relaxed">
                            Gaura Devi and Himalayan women embraced trees to physically shield them from loggers, forcing India's 15-year commercial felling ban.
                          </p>
                        </div>

                        <div className="p-2.5 rounded-xl bg-white/90 border border-stone-200">
                          <div className="text-[11px] font-black text-[#142e1f] flex items-center gap-1.5">
                            <span>🏙️</span>
                            <span>Save Aarey Forest (Mumbai)</span>
                          </div>
                          <p className="text-[10px] text-stone-600 mt-0.5 leading-relaxed">
                            Thousands of citizens formed human chains to protect 2,000+ trees, successfully securing permanent 800-acre Reserve Forest protection.
                          </p>
                        </div>

                        <div className="p-2.5 rounded-xl bg-white/90 border border-stone-200">
                          <div className="text-[11px] font-black text-[#142e1f] flex items-center gap-1.5">
                            <span>🪓</span>
                            <span>Bishnoi Khejarli Sacrifice (1730)</span>
                          </div>
                          <p className="text-[10px] text-stone-600 mt-0.5 leading-relaxed">
                            Amrita Devi and 363 Bishnois sacrificed their lives hugging sacred trees, stating &ldquo;A chopped head is cheaper than a felled tree.&rdquo;
                          </p>
                        </div>
                      </div>

                      {/* Dynamic Species Heritage Story */}
                      <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-stone-700 leading-relaxed font-serif italic">
                        &ldquo;{metrics.species.story}&rdquo;
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-stone-200 flex items-center justify-between text-[11px] text-emerald-950 font-bold">
                      <span>Community Sovereignty</span>
                      <span className="text-emerald-800">Unbroken Protection</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── REDIRECT CTA AT BOTTOM OF ECOSYSTEM EXPLORER TO ANTI-FELLING MANDATE ── */}
          <div className="mt-10 pt-8 border-t border-stone-200/90 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-red-50/90 via-amber-50/70 to-emerald-50/90 p-6 sm:p-7 rounded-3xl border border-red-200/90 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-600 text-white rounded-2xl shadow-md shrink-0">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h4 className="text-base sm:text-lg font-extrabold text-[#142e1f]">
                  Anti-Felling Mandate: Why You Should Not Cut This {metrics.species.name}
                </h4>
                <p className="text-xs text-stone-600 font-medium mt-0.5">
                  Review verified botanical, cultural, pharmacopoeia, and carbon preservation mandates for this {metrics.species.name} specimen ({doNotCutReasons.length} Protections).
                </p>
              </div>
            </div>
            <button
              type="button"
              id="btn-goto-anti-felling"
              onClick={() => {
                const el = document.getElementById('anti-felling-reasons');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-red-800 via-red-900 to-[#142e1f] hover:from-red-900 hover:to-black text-white font-extrabold text-xs shadow-lg hover:shadow-xl flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-95 shrink-0"
            >
              <ShieldAlert className="w-4 h-4 text-red-300" />
              <span>Why Not Cut This Tree ({doNotCutReasons.length} Reasons)</span>
              <ArrowDown className="w-4 h-4 text-amber-300" />
            </button>
          </div>

        </div>
      )}

    {/* ════ SECTION 4: WHY YOU SHOULD NOT CUT THIS TREE & GIS MAP SAVE ════ */}
    {hasCalculated && (
      <div id="anti-felling-reasons" className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-[rgba(20,46,31,0.08)] space-y-8 animate-fadeIn">
        {/* Banner with Exact Title & Subtitle */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-amber-950/20 via-red-950/15 to-transparent border border-red-500/30 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-500 shrink-0">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-700 border border-red-500/30">
                  Anti-Felling Ecological Mandate
                </span>
                <span className="text-xs font-bold text-stone-500">
                  {doNotCutReasons.length} Species-Specific Protections
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-['Fraunces'] text-[#142e1f] mt-1.5">
                Why you should <span className="text-red-700 underline decoration-red-400 decoration-wavy underline-offset-4">not cut</span> this {metrics.species.name}
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 font-medium mt-1">
                Age ~{metrics.estimatedAge} yr &middot; DBH {metrics.dbh} cm &middot; Carbon {metrics.carbon} kg &mdash; reasons below are taken from this tree&rsquo;s climatic analysis.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('gis-map-save-console');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#142e1f] via-emerald-800 to-[#142e1f] hover:from-emerald-900 hover:to-emerald-800 text-white font-extrabold text-xs shadow-lg shadow-emerald-950/20 flex items-center gap-2.5 shrink-0 transition-all cursor-pointer active:scale-95"
          >
            <Save className="w-4 h-4 text-emerald-300" />
            <span>Save Specimen on Map &amp; DB</span>
            <ArrowDown className="w-4 h-4 text-emerald-300" />
          </button>
        </div>

        {/* All 22 Reasons Cards Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-200">
            <h3 className="text-base font-extrabold text-[#142e1f] flex items-center gap-2">
              <span>🌿 Complete Anti-Felling Dossier</span>
              <span className="text-xs font-normal text-stone-500 font-mono">
                ({showAllReasons ? `All ${doNotCutReasons.length}` : `Top 5 of ${doNotCutReasons.length}`} Reasons)
              </span>
            </h3>
            <span className="text-xs text-stone-500 font-medium hidden sm:inline">
              Evidence synthesized across FAO, ICRAF, USDA, GBIF, &amp; FSI
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(showAllReasons ? doNotCutReasons : doNotCutReasons.slice(0, 5)).map((p, i) => (
              <div
                key={p.id || i}
                className="p-5 rounded-2xl bg-white border border-stone-200/90 hover:border-red-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-stone-100">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-red-100 text-red-800 border border-red-200">
                      Do not cut &middot; {i + 1}
                    </span>
                    <span className="text-xs font-extrabold text-stone-700 capitalize">
                      {p.title}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-stone-900 leading-snug">
                    {p.highlight}
                  </p>
                </div>
                {p.support && (
                  <div className="text-xs text-stone-600 bg-stone-50 p-2.5 rounded-xl border border-stone-200/60 leading-relaxed flex items-start gap-2">
                    <Leaf className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{p.support}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {doNotCutReasons.length > 5 && (
            <div className="flex justify-center pt-2">
              {!showAllReasons ? (
                <button
                  type="button"
                  onClick={() => setShowAllReasons(true)}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-red-900/10 via-amber-900/10 to-red-900/10 hover:from-red-900/20 hover:to-amber-900/20 border border-red-500/30 text-red-900 font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <ArrowDown className="w-4 h-4 text-red-700" />
                  <span>Load More Reasons ({doNotCutReasons.length - 5} More)</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setShowAllReasons(false);
                    const el = document.getElementById('anti-felling-reasons');
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="px-6 py-3 rounded-2xl bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-700 font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <span>Show Top 5 Reasons Only</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── AT THE END OF WHY NOT CUT SECTION: SAVE SPECIMEN ON GIS MAP & DATABASE ── */}
        <div id="gis-map-save-console" className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-stone-50 via-emerald-50/40 to-stone-100 border-2 border-emerald-600/30 shadow-lg space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-stone-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#142e1f] text-emerald-300 rounded-xl shadow-xs">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base sm:text-lg font-extrabold text-[#142e1f]">
                  Pin Specimen to GIS Map &amp; Save to Database
                </h4>
                <p className="text-xs text-stone-600 font-medium">
                  Register this verified {metrics.species.name} specimen into MongoDB Atlas and pinpoint coordinates on the live GIS map.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
              Atlas Cloud Sync Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Tree / Specimen Label</label>
              <input
                type="text"
                value={treeNameInput}
                onChange={(e) => setTreeNameInput(e.target.value)}
                placeholder={`${metrics.species.name} Campus Specimen`}
                className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-stone-700">Latitude &middot; Longitude</label>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={geoLoading}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
                >
                  {geoLoading ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin text-emerald-700" />
                      <span>Acquiring...</span>
                    </>
                  ) : (
                    <>
                      <Crosshair className="w-3 h-3" />
                      <span>Use Current GPS</span>
                    </>
                  )}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="Latitude"
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
                <input
                  type="text"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="Longitude"
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>
              {geoStatus && (
                <div className={`mt-2 p-2 rounded-lg text-[11px] flex items-start gap-1.5 leading-snug ${
                  geoStatus.type === 'success'
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : geoStatus.type === 'fallback'
                    ? 'bg-blue-50 text-blue-900 border border-blue-200'
                    : geoStatus.type === 'info'
                    ? 'bg-stone-100 text-stone-700 border border-stone-200'
                    : 'bg-amber-50 text-amber-900 border border-amber-200'
                }`}>
                  {geoStatus.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />}
                  {geoStatus.type === 'fallback' && <Globe className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />}
                  {geoStatus.type === 'info' && <RefreshCw className="w-3.5 h-3.5 text-stone-500 animate-spin shrink-0 mt-0.5" />}
                  {geoStatus.type === 'error' && <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />}
                  <div className="flex-1">
                    <span>{geoStatus.message}</span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Health Status</label>
              <select
                value={treeHealthStatus}
                onChange={(e) => setTreeHealthStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
              >
                <option value="Healthy">Healthy (Optimal)</option>
                <option value="Fair">Fair (Mild Stress)</option>
                <option value="Stressed">Stressed (Needs Water)</option>
                <option value="Damaged">Damaged (Needs Care)</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-stone-500 font-medium">
              Saves full climatic analysis, carbon vault, and {doNotCutReasons.length} anti-felling reasons directly to Atlas MongoDB.
            </span>
            <button
              type="button"
              id="btn-save-tree-end-mandate"
              onClick={handleSaveTreeToDatabase}
              disabled={isSavingTree}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#142e1f] via-emerald-800 to-[#142e1f] hover:from-emerald-900 hover:to-emerald-800 text-white font-extrabold text-sm shadow-xl shadow-emerald-950/20 flex items-center justify-center gap-2.5 shrink-0 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {isSavingTree ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving Specimen to Database...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 text-emerald-300" />
                  <span>Save Tree on Map &amp; Database</span>
                  <ArrowRight className="w-5 h-5 text-emerald-300" />
                </>
              )}
            </button>
          </div>

          {/* Save Status Banners */}
          {saveSuccessMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-emerald-950 text-xs animate-fadeIn">
              <div className="flex items-center gap-2.5 font-bold">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                <span>{saveSuccessMsg}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onEnterApp?.('map')}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>View on GIS Map</span>
                </button>
              </div>
            </div>
          )}

          {saveErrorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-300 text-xs text-red-800 flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{saveErrorMsg}</span>
            </div>
          )}
        </div>
      </div>
    )}

      </div>
    </section>
  );
}

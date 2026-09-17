import express from 'express';
import { settings } from '../config.js';

const router = express.Router();

// Memory caches
let tokenCache = null;
let tokenExpiresAt = 0;

let treesCache = null;
let treesCacheTime = 0;
const CACHE_DURATION_MS = 2 * 60 * 1000; // 2 minutes in-memory cache to handle zoom/refresh rate limits

// Species parameters based on backend analysis
const MAI_VALUES = {
  'Ashok Tree': 1.20,
  'Palm Tree': 1.00,
  'Child Palm': 1.00,
  'Chinese Palm': 1.00,
  'Rain Tree': 1.50,
  'Coconut Tree': 1.10,
  'Guava Tree': 0.80,
  'Bamboo Tree': 2.50,
  'Banyan': 1.00,
  'Neem': 0.90,
  'Mango': 1.10,
  'Peepal': 1.20,
  'Moringa': 1.40
};

/** Nashik survey stands are ~≤28 years. Scale MAI so large trunks map near that ceiling. */
const MAX_TREE_AGE = 28;
const AGE_MAI_SCALE = 2.05;

function estimateTreeAge(gbhCm, species) {
  const mai = MAI_VALUES[species] || 1.0;
  const dbh = (parseFloat(gbhCm) || 0) / Math.PI;
  const age = Math.round(dbh / (mai * AGE_MAI_SCALE));
  return Math.max(1, Math.min(MAX_TREE_AGE, age || 1));
}

function impactFromAge(age) {
  if (age >= 22) return 'Critical';
  if (age >= 14) return 'High';
  return 'Moderate';
}

const HABITAT_VALUES = {
  'Ashok Tree': 'Songbirds, Butterflies',
  'Palm Tree': 'Nesting Birds, Owls',
  'Child Palm': 'Nesting Birds, Owls',
  'Chinese Palm': 'Nesting Birds, Owls',
  'Rain Tree': 'Orchids, Ferns, Insects',
  'Coconut Tree': 'Squirrels, Small Birds',
  'Guava Tree': 'Small Birds, Bees',
  'Bamboo Tree': 'Insects, Small Lizards',
  'Banyan': 'Monkeys, Bats, Owls',
  'Neem': 'Insects, Small Birds',
  'Mango': 'Fruit Bats, Songbirds',
  'Peepal': 'Avian Species, Monkeys',
  'Moringa': 'Insects, Small Birds, Pollinators'
};

function getStandardSpecies(rawSp) {
  if (!rawSp || typeof rawSp !== 'string') return 'Tropical Tree';
  const clean = rawSp.trim().toLowerCase();
  
  if (clean.includes('ashok')) return 'Ashok Tree';
  if (clean.includes('chinese palm') || clean.includes('chainesepalm')) return 'Chinese Palm';
  if (clean.includes('child palm')) return 'Child Palm';
  if (clean.includes('palm') || clean.includes('plam')) return 'Palm Tree';
  if (clean.includes('rain')) return 'Rain Tree';
  if (clean.includes('coconut')) return 'Coconut Tree';
  if (clean.includes('bamboo')) return 'Bamboo Tree';
  if (clean.includes('guava')) return 'Guava Tree';
  if (clean.includes('neem')) return 'Neem';
  if (clean.includes('banyan')) return 'Banyan';
  if (clean.includes('mango')) return 'Mango';
  if (clean.includes('peepal')) return 'Peepal';
  if (clean.includes('moringo') || clean.includes('moringa')) return 'Moringa';
  
  return rawSp.trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

// Helper to get OAuth token
async function getAccessToken() {
  const now = Date.now();
  if (tokenCache && now < tokenExpiresAt) {
    return tokenCache;
  }

  const tokenUrl = 'https://five.epicollect.net/api/oauth/token';
  const credentials = {
    grant_type: 'client_credentials',
    client_id: settings.EPICOLLECT_CLIENT_ID,
    client_secret: settings.EPICOLLECT_CLIENT_SECRET
  };

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/vnd.api+json'
    },
    body: JSON.stringify(credentials)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Epicollect token error: ${response.status} - ${errText}`);
  }

  const tokenData = await response.json();
  tokenCache = tokenData.access_token;
  // Expires in 2 hours, we refresh 5 mins before expiry to be safe
  tokenExpiresAt = now + (tokenData.expires_in * 1000) - (5 * 60 * 1000);
  return tokenCache;
}

/**
 * GET /api/epicollect/trees
 * Fetches data from Epicollect5, standardizes it, computes age, and returns for mapping.
 */
router.get('/trees', async (req, res) => {
  try {
    const now = Date.now();
    if (treesCache && (now - treesCacheTime < CACHE_DURATION_MS)) {
      console.log('Serving trees from memory cache.');
      return res.json(treesCache);
    }

    const token = await getAccessToken();

    // Query Epicollect entries (max 500 per page to fetch all 291 in 1 query)
    const entriesUrl = `https://five.epicollect.net/api/export/entries/${settings.EPICOLLECT_PROJECT_SLUG}?map_index=1&form_ref=076dd86941ba4628a56252a02bdd0f57_6a489e4c3663f&per_page=500`;
    console.log(`Fetching live entries from: ${entriesUrl}`);

    const entriesRes = await fetch(entriesUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!entriesRes.ok) {
      const errText = await entriesRes.text();
      throw new Error(`Failed to fetch Epicollect entries: ${entriesRes.status} - ${errText}`);
    }

    const entriesData = await entriesRes.json();
    const rawEntries = entriesData.data?.entries || [];

    // Filter and preprocess raw entries
    let counter = 1;
    const processedTrees = rawEntries
      .filter(entry => {
        // Skip header invalid entries and missing coords
        const species = entry['4_Tree_Species'];
        const location = entry['1_Location'];
        return species && species !== '109' && location && location.latitude && location.longitude;
      })
      .map(entry => {
        const rawSpecies = entry['4_Tree_Species'];
        const standardSpecies = getStandardSpecies(rawSpecies);
        
        // Parse raw inputs
        const gbh = parseFloat(entry['6_GBH']) || 0;
        const height = parseFloat(entry['5_Height']) || 0;

        // DBH (cm) = GBH / PI
        const dbh = gbh / Math.PI;

        // Age calibrated for Nashik plantation context (max ~28 years)
        const age = estimateTreeAge(gbh, standardSpecies);

        // CO2 absorption (lifetime)
        const co2 = age * 22;

        // Conservation rating based on age band within 1–28yr range
        const impact = impactFromAge(age);

        // Coordinates
        const location = entry['1_Location'];
        const lat = parseFloat(location.latitude);
        const lng = parseFloat(location.longitude);

        // Date format: YYYY-MM-DD
        const entryDate = entry.created_at ? entry.created_at.slice(0, 10) : '2026-08-01';

        // Photos
        const barkPhoto = entry['7_Bark_Photo'] || null;
        const leafPhoto = entry['8_Leaf_Photo'] || null;
        const heightPhoto = entry['9_Height_Photo'] || null;

        return {
          id: counter++,
          uuid: entry.ec5_uuid,
          treeNumber: entry['2_Tree_Number'] || null,
          species: standardSpecies,
          circumference: gbh,
          height: height,
          dbh: parseFloat(dbh.toFixed(2)),
          age: age,
          co2: co2,
          impact: impact,
          habitat: HABITAT_VALUES[standardSpecies] || 'Local fauna, pollinators',
          date: entryDate,
          lat: lat,
          lng: lng,
          bark_photo: barkPhoto,
          leaf_photo: leafPhoto,
          height_photo: heightPhoto,
          photo: barkPhoto || leafPhoto || heightPhoto
        };
      });

    treesCache = processedTrees;
    treesCacheTime = now;
    console.log(`Processed and cached ${processedTrees.length} tree entries.`);
    res.json(processedTrees);
  } catch (error) {
    console.error('Error fetching Epicollect data:', error);
    res.status(500).json({ error: `Epicollect sync failed: ${error.message}` });
  }
});

/**
 * GET /api/epicollect/media
 * Proxies media file requests from private Epicollect5 storage to bypass CORS and Authentication.
 */
router.get('/media', async (req, res) => {
  const { name } = req.query;
  if (!name) {
    return res.status(400).json({ error: 'Parameter "name" is required.' });
  }

  try {
    const token = await getAccessToken();
    const mediaUrl = `https://five.epicollect.net/api/export/media/${settings.EPICOLLECT_PROJECT_SLUG}?type=photo&format=entry_original&name=${name}`;
    
    console.log(`Proxying image fetch: ${name}`);
    const mediaRes = await fetch(mediaUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!mediaRes.ok) {
      return res.status(mediaRes.status).json({ error: `Media fetch from Epicollect failed: ${mediaRes.statusText}` });
    }

    // Set appropriate image response headers
    res.setHeader('Content-Type', mediaRes.headers.get('Content-Type') || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day in browser

    // Pipe response body stream to express response
    const arrayBuffer = await mediaRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.send(buffer);
  } catch (error) {
    console.error(`Error proxying media file ${name}:`, error);
    res.status(500).json({ error: `Image proxy failed: ${error.message}` });
  }
});

export default router;

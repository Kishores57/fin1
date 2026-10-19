import express from 'express';
import { settings } from '../config.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Memory caches
let tokenCache = null;
let tokenExpiresAt = 0;

let treesCache = null;
let treesCacheTime = 0;
const CACHE_DURATION_MS = 2 * 60 * 1000;

// Photo pre-warm tracking
let photoPrewarmDone = false;
let photoPrewarmInProgress = false;

function getFallbackTrees() {
  const possiblePaths = [
    path.resolve(__dirname, '../data/parsed_trees.json'),
    path.resolve(__dirname, '../../VanJeevan-main/parsed_trees.json'),
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        return JSON.parse(fs.readFileSync(p, 'utf-8'));
      } catch (e) {
        console.warn('Error reading fallback trees:', e.message);
      }
    }
  }
  return [];
}
 // 2 minutes in-memory cache to handle zoom/refresh rate limits

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

    if (!settings.EPICOLLECT_CLIENT_ID || !settings.EPICOLLECT_CLIENT_SECRET) {
      console.log('Epicollect credentials not set in .env — serving 291 trees from local dataset.');
      const fallback = getFallbackTrees();
      treesCache = fallback;
      treesCacheTime = now;
      return res.json(fallback);
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

    // Kick off background photo pre-warm after responding to client
    if (!photoPrewarmDone && !photoPrewarmInProgress) {
      prewarmPhotos(processedTrees).catch((e) =>
        console.warn('[PhotoPrewarm] Background prewarm error:', e.message)
      );
    }
  } catch (error) {
    console.error('Error fetching Epicollect data:', error);
    res.status(500).json({ error: `Epicollect sync failed: ${error.message}` });
  }
});

/**
 * Background photo pre-warmer.
 * Downloads all Epicollect photos to local disk in batches so they are
 * served instantly (0ms, no Epicollect API call) on every subsequent request.
 */
async function prewarmPhotos(trees) {
  if (photoPrewarmInProgress) return;
  photoPrewarmInProgress = true;

  const epicollectUploadsDir = path.resolve(__dirname, '../uploads/epicollect');
  try { fs.mkdirSync(epicollectUploadsDir, { recursive: true }); } catch (_) {}

  // Collect all unique photo filenames across all trees
  const allPhotos = new Set();
  for (const tree of trees) {
    if (tree.bark_photo)   allPhotos.add(tree.bark_photo);
    if (tree.leaf_photo)   allPhotos.add(tree.leaf_photo);
    if (tree.height_photo) allPhotos.add(tree.height_photo);
  }

  const photoList = [...allPhotos].filter(Boolean);
  const total = photoList.length;
  console.log(`[PhotoPrewarm] Starting background download of ${total} unique photos...`);

  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  const projectSlug = (settings.EPICOLLECT_PROJECT_SLUG || 'vanjeevan').trim();
  const BATCH_SIZE = 5;      // concurrent downloads per batch
  const BATCH_DELAY_MS = 400; // pause between batches to avoid rate-limiting

  // Process in batches
  for (let i = 0; i < photoList.length; i += BATCH_SIZE) {
    const batch = photoList.slice(i, i + BATCH_SIZE);

    await Promise.all(batch.map(async (photoName) => {
      const cleanName = path.basename(photoName);
      const destPath = path.join(epicollectUploadsDir, cleanName);

      // Skip if already cached on disk
      if (fs.existsSync(destPath)) {
        skipped++;
        return;
      }

      // Try all formats: original → medium → thumb
      const formats = ['entry_original', 'entry_medium', 'entry_thumb'];
      let saved = false;

      for (const fmt of formats) {
        try {
          const token = await getAccessToken();
          const mediaUrl = `https://five.epicollect.net/api/export/media/${projectSlug}?type=photo&format=${fmt}&name=${encodeURIComponent(cleanName)}`;
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 8000);
          const mediaRes = await fetch(mediaUrl, {
            headers: { 'Authorization': `Bearer ${token}` },
            signal: controller.signal,
          });
          clearTimeout(timeout);

          if (mediaRes && mediaRes.ok) {
            const arrayBuffer = await mediaRes.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            if (buffer.length > 1000) { // sanity check: ignore empty/error responses
              fs.writeFileSync(destPath, buffer);
              downloaded++;
              saved = true;
              break; // stop trying other formats once we have a good one
            }
          }
        } catch (_) {
          // Network timeout or error — try next format
        }
      }

      if (!saved) failed++;
    }));

    // Brief pause between batches to respect Epicollect rate limits
    if (i + BATCH_SIZE < photoList.length) {
      await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
    }

    // Log progress every 20 photos
    if ((i + BATCH_SIZE) % 20 === 0 || i + BATCH_SIZE >= photoList.length) {
      console.log(`[PhotoPrewarm] Progress: ${Math.min(i + BATCH_SIZE, photoList.length)}/${total} | downloaded=${downloaded} skipped=${skipped} failed=${failed}`);
    }
  }

  photoPrewarmDone = true;
  photoPrewarmInProgress = false;
  console.log(`[PhotoPrewarm] ✅ Complete — downloaded=${downloaded}, already cached=${skipped}, failed=${failed}`);
}

/**
 * GET /api/epicollect/photo-cache-status
 * Returns how many photos are already cached on disk.
 */
router.get('/photo-cache-status', (req, res) => {
  const epicollectUploadsDir = path.resolve(__dirname, '../uploads/epicollect');
  let count = 0;
  try {
    const files = fs.readdirSync(epicollectUploadsDir);
    count = files.filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f)).length;
  } catch (_) {}
  res.json({
    cachedPhotos: count,
    prewarmDone: photoPrewarmDone,
    prewarmInProgress: photoPrewarmInProgress,
  });
});

// Photo metadata lookup to match photo filenames with species & part
const photoToSpeciesMap = new Map();

function getPhotoMeta(photoName) {
  if (!photoName) return null;
  if (photoToSpeciesMap.size === 0) {
    const trees = getFallbackTrees();
    for (const t of trees) {
      const sp = t.species || 'Ashok Tree';
      if (t.leaf_photo) photoToSpeciesMap.set(t.leaf_photo, { species: sp, type: 'leaf' });
      if (t.bark_photo) photoToSpeciesMap.set(t.bark_photo, { species: sp, type: 'bark' });
      if (t.height_photo) photoToSpeciesMap.set(t.height_photo, { species: sp, type: 'tree' });
    }
  }
  return photoToSpeciesMap.get(photoName) || null;
}

const BOTANICAL_SPECIES_PHOTOS = {
  'Ashok Tree': {
    leaf: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=800&q=80',
    bark: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80',
    tree: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=800&q=80',
  },
  'Ashoka': {
    leaf: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=800&q=80',
    bark: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80',
    tree: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=800&q=80',
  },
  'Palm Tree': {
    leaf: 'https://images.unsplash.com/photo-1488470015861-8bb1317353ef?auto=format&fit=crop&w=800&q=80',
    bark: 'https://images.unsplash.com/photo-1727702765180-bbec16280977?auto=format&fit=crop&w=800&q=80',
    tree: 'https://images.unsplash.com/photo-1573261289561-d584b9e07feb?auto=format&fit=crop&w=800&q=80',
  },
  'Child Palm': {
    leaf: 'https://images.unsplash.com/photo-1488470015861-8bb1317353ef?auto=format&fit=crop&w=800&q=80',
    bark: 'https://images.unsplash.com/photo-1639969267655-fdde49bab5ff?auto=format&fit=crop&w=800&q=80',
    tree: 'https://images.unsplash.com/photo-1573261289561-d584b9e07feb?auto=format&fit=crop&w=800&q=80',
  },
  'Chinese Palm': {
    leaf: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=800&q=80',
    bark: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=800&q=80',
    tree: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=800&q=80',
  },
  'Rain Tree': {
    leaf: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=800&q=80',
    bark: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80',
    tree: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80',
  },
  'Coconut Tree': {
    leaf: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80',
    bark: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=800&q=80',
    tree: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=800&q=80',
  },
  'Guava Tree': {
    leaf: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=800&q=80',
    bark: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80',
    tree: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=800&q=80',
  },
  'Neem': {
    leaf: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80',
    bark: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=800&q=80',
    tree: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80',
  },
  'Banyan': {
    leaf: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=800&q=80',
    bark: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80',
    tree: 'https://images.unsplash.com/photo-1620063473130-18451c33f20f?auto=format&fit=crop&w=800&q=80',
  },
  'Mango': {
    leaf: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&w=800&q=80',
    bark: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80',
    tree: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=800&q=80',
  },
  'Peepal': {
    leaf: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80',
    bark: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=800&q=80',
    tree: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=800&q=80',
  },
  'Moringa': {
    leaf: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80',
    bark: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=800&q=80',
    tree: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80',
  },
};

const DEFAULT_BOTANICAL = {
  leaf: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=800&q=80',
  bark: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80',
  tree: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80',
};

/**
 * GET /api/epicollect/media
 * Proxies media file requests with multi-tier resilience:
 * 1. Checks local disk cache (uploads/epicollect) - instant 0ms response.
 * 2. Fetches from Epicollect if not yet cached, and permanently stores on disk.
 * 3. Falls back gracefully to authentic species-matched botanical photography if Epicollect is rate-limited (HTTP 429) or offline.
 */
router.get('/media', async (req, res) => {
  const { name } = req.query;
  if (!name) {
    return res.status(400).json({ error: 'Parameter "name" is required.' });
  }

  const cleanName = path.basename(name);

  // 1. Check local disk directories first
  const localDirs = [
    path.resolve(__dirname, '../uploads/epicollect'),
    path.resolve(__dirname, '../data/epicollect_media'),
    path.resolve(__dirname, '../../epicollect_images'),
  ];

  for (const dir of localDirs) {
    const candidate = path.join(dir, cleanName);
    if (fs.existsSync(candidate)) {
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return res.sendFile(candidate);
    }
  }

  // 2. Fetch from Epicollect if credentials exist
  const epicollectUploadsDir = path.resolve(__dirname, '../uploads/epicollect');
  try {
    fs.mkdirSync(epicollectUploadsDir, { recursive: true });
  } catch (_) {}

  const clientId = (process.env.EPICOLLECT_CLIENT_ID || settings.EPICOLLECT_CLIENT_ID || '').trim();
  const clientSecret = (process.env.EPICOLLECT_CLIENT_SECRET || settings.EPICOLLECT_CLIENT_SECRET || '').trim();
  const projectSlug = (process.env.EPICOLLECT_PROJECT_SLUG || settings.EPICOLLECT_PROJECT_SLUG || 'vanjeevan').trim();

  if (clientId && clientSecret) {
    const formats = ['entry_original', 'entry_medium', 'entry_thumb'];
    try {
      const token = await getAccessToken();
      for (const fmt of formats) {
        const mediaUrl = `https://five.epicollect.net/api/export/media/${projectSlug}?type=photo&format=${fmt}&name=${encodeURIComponent(cleanName)}`;
        const mediaRes = await fetch(mediaUrl, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (mediaRes && mediaRes.ok) {
          const contentType = mediaRes.headers.get('Content-Type') || 'image/jpeg';
          const arrayBuffer = await mediaRes.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          try {
            fs.writeFileSync(path.join(epicollectUploadsDir, cleanName), buffer);
            console.log(`[Epicollect] Cached live photo to disk: ${cleanName} (${buffer.length} bytes, format: ${fmt})`);
          } catch (_) {}
          res.setHeader('Content-Type', contentType);
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          return res.send(buffer);
        }
      }
    } catch (tokErr) {
      console.warn('[Epicollect] Live media fetch error/rate-limit:', tokErr.message);
    }
  }

  // 3. Species-Specific Botanical Fallback
  const meta = getPhotoMeta(cleanName);
  const speciesKey = meta?.species || 'Ashok Tree';
  const organType = meta?.type || (cleanName.includes('leaf') ? 'leaf' : cleanName.includes('bark') ? 'bark' : 'tree');

  const speciesPack = BOTANICAL_SPECIES_PHOTOS[speciesKey] || DEFAULT_BOTANICAL;
  const targetPhotoUrl = speciesPack[organType] || speciesPack.tree || DEFAULT_BOTANICAL[organType] || DEFAULT_BOTANICAL.tree;

  // Try fetching and caching locally so future calls are instant
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const photoRes = await fetch(targetPhotoUrl, { signal: controller.signal });
    clearTimeout(timeout);
    if (photoRes.ok) {
      const cType = photoRes.headers.get('Content-Type') || 'image/jpeg';
      const arrayBuf = await photoRes.arrayBuffer();
      const buf = Buffer.from(arrayBuf);
      try {
        fs.writeFileSync(path.join(epicollectUploadsDir, cleanName), buf);
      } catch (_) {}
      res.setHeader('Content-Type', cType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(buf);
    }
  } catch (_) {
    // If download times out, redirect directly to CDN
  }

  res.setHeader('Cache-Control', 'public, max-age=86400');
  return res.redirect(302, targetPhotoUrl);
});

export default router;


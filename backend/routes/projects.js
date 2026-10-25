import express from 'express';
import multer from 'multer';
import * as xlsx from 'xlsx';
import db from '../database/connection.js';
import { CalculatorService } from '../services/calculator.js';
import { SPECIES_GROWTH_FACTOR, estimateTreeAge } from './epicollect.js';

const router = express.Router();

// Memory storage for file previews and uploads (up to 25MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

// Helper for rounding
const round = (val, d = 2) => {
  const n = Number(val);
  if (!Number.isFinite(n)) return 0;
  const f = 10 ** d;
  return Math.round(n * f) / f;
};

// Wood density lookup fallback
const WOOD_DENSITY_MAP = {
  'Ashok Tree': 0.67,
  'Ashoka': 0.67,
  'Palm Tree': 0.40,
  'Child Palm': 0.40,
  'Chinese Palm': 0.40,
  'Rain Tree': 0.50,
  'Coconut Tree': 0.50,
  'Coconut': 0.50,
  'Guava Tree': 0.65,
  'Bamboo Tree': 0.40,
  'Bamboo': 0.40,
  'Banyan': 0.58,
  'Neem': 0.72,
  'Mango': 0.65,
  'Peepal': 0.52,
  'Moringa': 0.45,
  'Badam': 0.55,
  'Silver Oak': 0.55,
  'Tej Patta': 0.60,
  'Rubber': 0.60,
};

function getWoodDensity(speciesName) {
  if (!speciesName) return 0.55;
  for (const [key, val] of Object.entries(WOOD_DENSITY_MAP)) {
    if (speciesName.toLowerCase().includes(key.toLowerCase())) {
      return val;
    }
  }
  return 0.55;
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. GET /api/projects - List all projects with summary metrics
 * ─────────────────────────────────────────────────────────────────────────────
 */
router.get('/', async (req, res) => {
  try {
    const projects = await db.all('SELECT * FROM projects ORDER BY created_at ASC');
    const enriched = await Promise.all(
      projects.map(async (p) => {
        const stats = await db.get(
          `SELECT 
            COUNT(*) as totalTrees,
            COUNT(DISTINCT species) as speciesCount,
            SUM(biomass) as totalBiomass,
            SUM(co2_estimate) as totalCo2
           FROM project_trees WHERE project_id = ?`,
          [p.id]
        );

        let boundary = null;
        try {
          if (p.boundary_geojson) boundary = JSON.parse(p.boundary_geojson);
        } catch (_) {}

        return {
          ...p,
          boundary,
          totalTrees: stats?.totalTrees || 0,
          speciesCount: stats?.speciesCount || 0,
          totalBiomassTonnes: round((stats?.totalBiomass || 0) / 1000, 2),
          totalCo2Tonnes: round((stats?.totalCo2 || 0) / 1000, 2),
        };
      })
    );

    res.json({ projects: enriched });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to retrieve projects list.' });
  }
});

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 2. POST /api/projects - Create a new project
 * ─────────────────────────────────────────────────────────────────────────────
 */
router.post('/', async (req, res) => {
  try {
    const {
      name,
      organization,
      description,
      country = 'India',
      state = 'Maharashtra',
      city,
      study_area,
      center_lat,
      center_lng,
      zoom_level = 16,
      boundary,
      coordinator,
      contact_email,
      data_source = 'manual',
    } = req.body;

    if (!name || !organization || !city || !coordinator || !contact_email) {
      return res.status(400).json({
        error: 'Missing required fields: Project Name, Organization, City, Coordinator Name, and Contact Email are required.',
      });
    }

    // Generate clean slug / ID
    const cleanSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 30);
    const uniqueId = `proj-${cleanSlug}-${Date.now().toString(36)}`;

    const lat = parseFloat(center_lat) || 20.0135;
    const lng = parseFloat(center_lng) || 73.8213;
    const zoom = parseInt(zoom_level, 10) || 16;
    const boundaryStr = boundary ? JSON.stringify(boundary) : null;

    await db.run(
      `INSERT INTO projects (
        id, name, organization, description, country, state, city, study_area,
        center_lat, center_lng, zoom_level, boundary_geojson, coordinator, contact_email, data_source
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        uniqueId,
        name.trim(),
        organization.trim(),
        description ? description.trim() : null,
        country.trim(),
        state.trim(),
        city.trim(),
        study_area ? study_area.trim() : null,
        lat,
        lng,
        zoom,
        boundaryStr,
        coordinator.trim(),
        contact_email.trim(),
        data_source,
      ]
    );

    const created = await db.get('SELECT * FROM projects WHERE id = ?', [uniqueId]);
    let parsedBoundary = null;
    try {
      if (created.boundary_geojson) parsedBoundary = JSON.parse(created.boundary_geojson);
    } catch (_) {}

    res.status(201).json({
      message: 'Project created successfully',
      project: { ...created, boundary: parsedBoundary, totalTrees: 0, speciesCount: 0 },
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create new tree inventory project.' });
  }
});

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 3. GET /api/projects/:id - Fetch single project details
 * ─────────────────────────────────────────────────────────────────────────────
 */
router.get('/:id', async (req, res) => {
  try {
    const project = await db.get('SELECT * FROM projects WHERE id = ?', [req.params.id]);
    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    const stats = await db.get(
      `SELECT 
        COUNT(*) as totalTrees,
        COUNT(DISTINCT species) as speciesCount,
        SUM(biomass) as totalBiomass,
        SUM(co2_estimate) as totalCo2,
        SUM(oxygen_production) as totalOxygen
       FROM project_trees WHERE project_id = ?`,
      [project.id]
    );

    const mapped = await db.get(
      `SELECT COUNT(*) as mappedCount FROM project_trees 
       WHERE project_id = ? AND latitude IS NOT NULL AND longitude IS NOT NULL`,
      [project.id]
    );

    let boundary = null;
    try {
      if (project.boundary_geojson) boundary = JSON.parse(project.boundary_geojson);
    } catch (_) {}

    res.json({
      project: {
        ...project,
        boundary,
        totalTrees: stats?.totalTrees || 0,
        mappedTrees: mapped?.mappedCount || 0,
        unmappedTrees: (stats?.totalTrees || 0) - (mapped?.mappedCount || 0),
        speciesCount: stats?.speciesCount || 0,
        totalBiomassKg: round(stats?.totalBiomass || 0),
        totalBiomassTonnes: round((stats?.totalBiomass || 0) / 1000, 2),
        totalCo2Kg: round(stats?.totalCo2 || 0),
        totalCo2Tonnes: round((stats?.totalCo2 || 0) / 1000, 2),
        totalOxygenKg: round(stats?.totalOxygen || 0),
        totalOxygenTonnes: round((stats?.totalOxygen || 0) / 1000, 2),
      },
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Failed to retrieve project details.' });
  }
});

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 4. PUT /api/projects/:id - Update project metadata or boundary
 * ─────────────────────────────────────────────────────────────────────────────
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await db.get('SELECT * FROM projects WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    const {
      name = existing.name,
      organization = existing.organization,
      description = existing.description,
      country = existing.country,
      state = existing.state,
      city = existing.city,
      study_area = existing.study_area,
      center_lat = existing.center_lat,
      center_lng = existing.center_lng,
      zoom_level = existing.zoom_level,
      boundary,
      coordinator = existing.coordinator,
      contact_email = existing.contact_email,
    } = req.body;

    const boundaryStr = boundary !== undefined ? (boundary ? JSON.stringify(boundary) : null) : existing.boundary_geojson;

    await db.run(
      `UPDATE projects SET 
        name = ?, organization = ?, description = ?, country = ?, state = ?, city = ?,
        study_area = ?, center_lat = ?, center_lng = ?, zoom_level = ?, boundary_geojson = ?,
        coordinator = ?, contact_email = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        name,
        organization,
        description,
        country,
        state,
        city,
        study_area,
        parseFloat(center_lat) || existing.center_lat,
        parseFloat(center_lng) || existing.center_lng,
        parseInt(zoom_level, 10) || existing.zoom_level,
        boundaryStr,
        coordinator,
        contact_email,
        id,
      ]
    );

    const updated = await db.get('SELECT * FROM projects WHERE id = ?', [id]);
    let parsedBoundary = null;
    try {
      if (updated.boundary_geojson) parsedBoundary = JSON.parse(updated.boundary_geojson);
    } catch (_) {}

    res.json({ message: 'Project updated successfully', project: { ...updated, boundary: parsedBoundary } });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project.' });
  }
});

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 5. DELETE /api/projects/:id - Delete project & its trees
 * ─────────────────────────────────────────────────────────────────────────────
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (id === 'kkwagh-campus') {
      return res.status(403).json({ error: 'Default baseline campus project cannot be deleted.' });
    }
    const existing = await db.get('SELECT id FROM projects WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    await db.run('DELETE FROM project_trees WHERE project_id = ?', [id]);
    await db.run('DELETE FROM projects WHERE id = ?', [id]);
    res.json({ message: 'Project and all associated trees deleted successfully.' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project.' });
  }
});

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 6. POST /api/projects/preview-file - Upload and preview CSV / Excel / GeoJSON
 * ─────────────────────────────────────────────────────────────────────────────
 */
router.post('/preview-file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Please upload a CSV, Excel (.xlsx/.xls), or GeoJSON file.' });
    }

    const originalName = req.file.originalname || 'dataset';
    const ext = originalName.slice(originalName.lastIndexOf('.')).toLowerCase();
    const buffer = req.file.buffer;

    let rows = [];
    let headers = [];

    if (ext === '.geojson' || ext === '.json') {
      const jsonContent = JSON.parse(buffer.toString('utf8'));
      if (jsonContent.type === 'FeatureCollection' && Array.isArray(jsonContent.features)) {
        rows = jsonContent.features.map((f, i) => {
          const props = f.properties || {};
          let lat = null;
          let lng = null;
          if (f.geometry && f.geometry.type === 'Point' && Array.isArray(f.geometry.coordinates)) {
            lng = f.geometry.coordinates[0];
            lat = f.geometry.coordinates[1];
          }
          return {
            ...props,
            latitude: lat !== null ? lat : props.latitude || props.lat,
            longitude: lng !== null ? lng : props.longitude || props.lon || props.lng,
            _geojson_id: f.id || `feat-${i + 1}`,
          };
        });
      } else if (Array.isArray(jsonContent)) {
        rows = jsonContent;
      } else {
        return res.status(400).json({ error: 'Unrecognized JSON format. Expected FeatureCollection or array of tree objects.' });
      }
      headers = rows.length > 0 ? Object.keys(rows[0]) : [];
    } else {
      // Excel or CSV parsed via XLSX engine
      const workbook = xlsx.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        return res.status(400).json({ error: 'Uploaded spreadsheet is empty.' });
      }
      const sheet = workbook.Sheets[sheetName];
      rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });
      if (rows.length === 0) {
        return res.status(400).json({ error: 'No records found in spreadsheet.' });
      }
      headers = Object.keys(rows[0]);
    }

    // Auto-detect column mapping
    const detectedMapping = {
      species: '',
      latitude: '',
      longitude: '',
      height: '',
      gbh: '',
      dbh: '',
      treeId: '',
      age: '',
      condition: '',
    };

    for (const h of headers) {
      const clean = h.trim().toLowerCase().replace(/[\s_-]+/g, '');
      if (!detectedMapping.species && (clean.includes('species') || clean.includes('treename') || clean.includes('scientific'))) {
        detectedMapping.species = h;
      }
      if (!detectedMapping.latitude && (clean === 'latitude' || clean === 'lat' || clean === 'y' || clean === 'gpslatitude')) {
        detectedMapping.latitude = h;
      }
      if (!detectedMapping.longitude && (clean === 'longitude' || clean === 'lon' || clean === 'lng' || clean === 'x' || clean === 'gpslongitude')) {
        detectedMapping.longitude = h;
      }
      if (!detectedMapping.height && (clean.includes('height') || clean === 'ht' || clean === 'heightm')) {
        detectedMapping.height = h;
      }
      if (!detectedMapping.gbh && (clean.includes('gbh') || clean.includes('circumference') || clean.includes('girth'))) {
        detectedMapping.gbh = h;
      }
      if (!detectedMapping.dbh && (clean.includes('dbh') || clean.includes('diameter'))) {
        detectedMapping.dbh = h;
      }
      if (!detectedMapping.treeId && (clean.includes('treeid') || clean.includes('treenumber') || clean === 'id' || clean === 'tag' || clean === 'uuid')) {
        detectedMapping.treeId = h;
      }
      if (!detectedMapping.age && (clean === 'age' || clean.includes('treeage') || clean.includes('estage'))) {
        detectedMapping.age = h;
      }
      if (!detectedMapping.condition && (clean.includes('condition') || clean.includes('health') || clean.includes('status'))) {
        detectedMapping.condition = h;
      }
    }

    // Validation summary
    let validCount = 0;
    let missingSpecies = 0;
    let missingCoords = 0;
    let invalidCoords = 0;
    const seenIds = new Set();
    let duplicates = 0;

    const latCol = detectedMapping.latitude;
    const lngCol = detectedMapping.longitude;
    const spCol = detectedMapping.species;
    const idCol = detectedMapping.treeId;

    rows.forEach((r, idx) => {
      const sp = spCol ? String(r[spCol] || '').trim() : '';
      const latVal = latCol ? parseFloat(r[latCol]) : NaN;
      const lngVal = lngCol ? parseFloat(r[lngCol]) : NaN;
      const idVal = idCol ? String(r[idCol] || '') : `row-${idx}`;

      let isValid = true;
      if (!sp) {
        missingSpecies++;
        isValid = false;
      }

      if (isNaN(latVal) || isNaN(lngVal)) {
        missingCoords++;
        isValid = false;
      } else if (latVal < -90 || latVal > 90 || lngVal < -180 || lngVal > 180) {
        invalidCoords++;
        isValid = false;
      }

      if (seenIds.has(idVal)) {
        duplicates++;
      } else {
        seenIds.add(idVal);
      }

      if (isValid) validCount++;
    });

    res.json({
      fileName: originalName,
      fileType: ext,
      totalRows: rows.length,
      headers,
      detectedMapping,
      sampleRows: rows.slice(0, 50),
      validation: {
        total: rows.length,
        validCount,
        invalidCount: rows.length - validCount,
        missingSpecies,
        missingCoords,
        invalidCoords,
        duplicates,
      },
    });
  } catch (error) {
    console.error('Error previewing file:', error);
    res.status(500).json({ error: `File parsing error: ${error.message}` });
  }
});

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 7. POST /api/projects/epicollect-fetch - Fetch & preview Epicollect5 live data
 * ─────────────────────────────────────────────────────────────────────────────
 */
router.post('/epicollect-fetch', async (req, res) => {
  try {
    const { projectSlug, clientId, clientSecret, url } = req.body;

    let slug = (projectSlug || '').trim();
    if (!slug && url) {
      const match = url.match(/project\/([a-zA-Z0-9_-]+)/i);
      if (match) slug = match[1];
    }

    if (!slug) {
      return res.status(400).json({ error: 'Please enter a valid Epicollect5 Project ID, slug, or project URL.' });
    }

    let token = null;
    if (clientId && clientSecret) {
      try {
        const tokenRes = await fetch('https://five.epicollect.net/api/oauth/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/vnd.api+json' },
          body: JSON.stringify({
            grant_type: 'client_credentials',
            client_id: clientId.trim(),
            client_secret: clientSecret.trim(),
          }),
        });
        if (tokenRes.ok) {
          const tData = await tokenRes.json();
          token = tData.access_token;
        }
      } catch (tokErr) {
        console.warn('OAuth attempt error:', tokErr.message);
      }
    }

    const entriesUrl = `https://five.epicollect.net/api/export/entries/${encodeURIComponent(slug)}?map_index=1&per_page=500`;
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const apiRes = await fetch(entriesUrl, { headers });

    if (!apiRes.ok) {
      if (apiRes.status === 404) {
        return res.status(404).json({
          error: `Epicollect5 project "${slug}" was not found. Please confirm the project slug on five.epicollect.net.`,
        });
      }
      if (apiRes.status === 401 || apiRes.status === 403) {
        return res.status(401).json({
          error: `Project "${slug}" is private. Please provide Client ID and Client Secret from your Epicollect5 project settings.`,
        });
      }
      const errText = await apiRes.text();
      return res.status(apiRes.status).json({
        error: `Epicollect5 API responded with status ${apiRes.status}: ${errText.slice(0, 150)}`,
      });
    }

    const data = await apiRes.json();
    const rawEntries = data.data?.entries || [];

    if (rawEntries.length === 0) {
      return res.json({
        slug,
        totalRecords: 0,
        entries: [],
        detectedFields: [],
        summary: { total: 0, validCoords: 0, missingCoords: 0, species: [] },
      });
    }

    // Inspect fields across entries
    const fieldSet = new Set();
    rawEntries.slice(0, 20).forEach((entry) => {
      Object.keys(entry).forEach((k) => fieldSet.add(k));
    });
    const detectedFields = Array.from(fieldSet);

    // Auto-detect key candidates
    const detectedMapping = {
      species: '',
      latitude: '',
      longitude: '',
      locationObject: '',
      height: '',
      gbh: '',
      treeId: '',
    };

    for (const f of detectedFields) {
      const lower = f.toLowerCase();
      if (!detectedMapping.species && lower.includes('species')) detectedMapping.species = f;
      if (!detectedMapping.height && lower.includes('height')) detectedMapping.height = f;
      if (!detectedMapping.gbh && (lower.includes('gbh') || lower.includes('circumference'))) detectedMapping.gbh = f;
      if (!detectedMapping.treeId && (lower.includes('number') || lower.includes('tree_id') || lower === 'ec5_uuid')) detectedMapping.treeId = f;
      if (!detectedMapping.locationObject && (lower.includes('location') || lower.includes('gps'))) {
        detectedMapping.locationObject = f;
      }
    }

    // Coordinates count and species detection
    let validCoords = 0;
    let missingCoords = 0;
    const speciesFound = new Set();

    const flattened = rawEntries.map((e, idx) => {
      let lat = null;
      let lng = null;

      // Check object location (standard in Epicollect)
      if (detectedMapping.locationObject && typeof e[detectedMapping.locationObject] === 'object' && e[detectedMapping.locationObject]) {
        lat = parseFloat(e[detectedMapping.locationObject].latitude);
        lng = parseFloat(e[detectedMapping.locationObject].longitude);
      } else {
        lat = parseFloat(e.latitude || e.lat);
        lng = parseFloat(e.longitude || e.lon || e.lng);
      }

      const sp = detectedMapping.species ? String(e[detectedMapping.species] || '') : '';
      if (sp) speciesFound.add(sp);

      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        validCoords++;
      } else {
        missingCoords++;
      }

      return {
        ...e,
        _parsed_lat: !isNaN(lat) ? lat : null,
        _parsed_lng: !isNaN(lng) ? lng : null,
        _parsed_id: idx + 1,
      };
    });

    res.json({
      slug,
      totalRecords: rawEntries.length,
      detectedFields,
      detectedMapping,
      sampleEntries: flattened.slice(0, 30),
      summary: {
        total: rawEntries.length,
        validCoords,
        missingCoords,
        speciesCount: speciesFound.size,
        speciesList: Array.from(speciesFound).slice(0, 15),
      },
    });
  } catch (error) {
    console.error('Error fetching Epicollect data:', error);
    res.status(500).json({ error: `Epicollect5 retrieval failed: ${error.message}` });
  }
});

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 8. POST /api/projects/:id/import - Save validated trees and calculate allometry
 * ─────────────────────────────────────────────────────────────────────────────
 */
router.post('/:id/import', async (req, res) => {
  try {
    const { id } = req.params;
    const project = await db.get('SELECT * FROM projects WHERE id = ?', [id]);
    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    const {
      rows = [],
      mapping = {},
      excludeInvalid = false,
      clearExisting = false,
      dataSource = 'upload',
    } = req.body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'No tree records provided for import.' });
    }

    if (clearExisting) {
      await db.run('DELETE FROM project_trees WHERE project_id = ?', [id]);
    }

    let importedCount = 0;
    let skippedCount = 0;
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        const rawSpecies = mapping.species ? r[mapping.species] : r.species || r.tree_species;
        const speciesName = (rawSpecies ? String(rawSpecies).trim() : 'Native Tree') || 'Native Tree';

        // Extract coordinates
        let lat = null;
        let lng = null;

        if (mapping.locationObject && r[mapping.locationObject] && typeof r[mapping.locationObject] === 'object') {
          lat = parseFloat(r[mapping.locationObject].latitude);
          lng = parseFloat(r[mapping.locationObject].longitude);
        } else {
          const latKey = mapping.latitude || 'latitude';
          const lngKey = mapping.longitude || 'longitude';
          lat = parseFloat(r[latKey] !== undefined ? r[latKey] : r.lat);
          lng = parseFloat(r[lngKey] !== undefined ? r[lngKey] : r.lng || r.lon);
        }

        const isCoordValid = Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;

        if (excludeInvalid && !isCoordValid) {
          skippedCount++;
          continue;
        }

        // Tree dimensions
        const gbhKey = mapping.gbh || 'gbh';
        const dbhKey = mapping.dbh || 'dbh';
        const heightKey = mapping.height || 'height';
        const treeIdKey = mapping.treeId || 'treeId';

        let gbh = parseFloat(r[gbhKey] !== undefined ? r[gbhKey] : r.circumference);
        let dbh = parseFloat(r[dbhKey] !== undefined ? r[dbhKey] : r.diameter);
        let height = parseFloat(r[heightKey] !== undefined ? r[heightKey] : r.tree_height);

        if ((!Number.isFinite(dbh) || dbh <= 0) && Number.isFinite(gbh) && gbh > 0) {
          dbh = gbh / Math.PI;
        } else if ((!Number.isFinite(gbh) || gbh <= 0) && Number.isFinite(dbh) && dbh > 0) {
          gbh = dbh * Math.PI;
        } else if (!Number.isFinite(dbh) || dbh <= 0) {
          dbh = 24.0;
          gbh = dbh * Math.PI;
        }

        if (!Number.isFinite(height) || height <= 0) {
          height = Math.round(Math.max(3.5, Math.min(22, 1.2 * Math.pow(dbh, 0.65))) * 10) / 10;
        }

        // Calculations via Chave allometry
        const woodDensity = getWoodDensity(speciesName);
        const age = estimateTreeAge(gbh, speciesName);
        const chaveVal = woodDensity * Math.pow(dbh, 2) * height;
        const biomass = round(0.0673 * Math.pow(chaveVal, 0.976), 2);
        const carbon = round(biomass * 0.47, 2);
        const co2 = round(carbon * 3.67, 2);
        const oxygen = round(carbon * 2.67, 2);

        const treeId = (mapping.treeId && r[mapping.treeId]) || r.tree_number || r.id || `T-${i + 1}`;
        const condition = (mapping.condition && r[mapping.condition]) || r.condition || 'Healthy';

        const extra = { ...r };
        delete extra[mapping.species];
        delete extra[mapping.latitude];
        delete extra[mapping.longitude];

        await db.run(
          `INSERT INTO project_trees (
            project_id, tree_id, species, latitude, longitude, height, gbh, dbh, age,
            biomass, carbon_storage, co2_estimate, oxygen_production, condition, additional_attributes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            String(treeId),
            speciesName,
            isCoordValid ? lat : null,
            isCoordValid ? lng : null,
            round(height, 1),
            round(gbh, 1),
            round(dbh, 2),
            round(age, 1),
            biomass,
            carbon,
            co2,
            oxygen,
            condition,
            JSON.stringify(extra),
          ]
        );

        importedCount++;
      } catch (rowErr) {
        skippedCount++;
        if (errors.length < 5) errors.push(`Row ${i + 1}: ${rowErr.message}`);
      }
    }

    // Update project datasource and timestamp
    await db.run(
      'UPDATE projects SET data_source = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [dataSource, id]
    );

    res.json({
      message: `Successfully imported ${importedCount} tree records.`,
      importedCount,
      skippedCount,
      errors,
    });
  } catch (error) {
    console.error('Error importing trees:', error);
    res.status(500).json({ error: `Import failed: ${error.message}` });
  }
});

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 9. GET /api/projects/:id/trees - Get project tree records with filtering
 * ─────────────────────────────────────────────────────────────────────────────
 */
router.get('/:id/trees', async (req, res) => {
  try {
    const { id } = req.params;
    const { species, condition, search, limit = 500, offset = 0 } = req.query;

    const project = await db.get('SELECT id FROM projects WHERE id = ?', [id]);
    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    let sql = 'SELECT * FROM project_trees WHERE project_id = ?';
    const params = [id];

    if (species && species !== 'all') {
      sql += ' AND species = ?';
      params.push(species);
    }

    if (condition && condition !== 'all') {
      sql += ' AND condition = ?';
      params.push(condition);
    }

    if (search) {
      sql += ' AND (species LIKE ? OR tree_id LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY id ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const trees = await db.all(sql, params);

    const counts = await db.get(
      `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 END) as mapped,
        COUNT(CASE WHEN latitude IS NULL OR longitude IS NULL THEN 1 END) as unmapped
       FROM project_trees WHERE project_id = ?`,
      [id]
    );

    const speciesList = await db.all(
      'SELECT DISTINCT species, COUNT(*) as count FROM project_trees WHERE project_id = ? GROUP BY species ORDER BY count DESC',
      [id]
    );

    res.json({
      trees: trees.map((t) => {
        let additional = {};
        try {
          if (t.additional_attributes) additional = JSON.parse(t.additional_attributes);
        } catch (_) {}
        return {
          ...t,
          additional,
        };
      }),
      totalCount: counts?.total || 0,
      mappedCount: counts?.mapped || 0,
      unmappedCount: counts?.unmapped || 0,
      speciesList,
    });
  } catch (error) {
    console.error('Error fetching project trees:', error);
    res.status(500).json({ error: 'Failed to retrieve tree inventory.' });
  }
});

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 10. GET /api/projects/:id/stats - Analytical environmental dashboard
 * ─────────────────────────────────────────────────────────────────────────────
 */
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    const project = await db.get('SELECT * FROM projects WHERE id = ?', [id]);
    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    const totals = await db.get(
      `SELECT 
        COUNT(*) as totalTrees,
        COUNT(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 END) as mappedTrees,
        COUNT(CASE WHEN latitude IS NULL OR longitude IS NULL THEN 1 END) as unmappedTrees,
        COUNT(DISTINCT species) as speciesCount,
        SUM(biomass) as totalBiomass,
        SUM(carbon_storage) as totalCarbon,
        SUM(co2_estimate) as totalCo2,
        SUM(oxygen_production) as totalOxygen,
        AVG(age) as avgAge,
        AVG(dbh) as avgDbh,
        AVG(height) as avgHeight
       FROM project_trees WHERE project_id = ?`,
      [id]
    );

    const totalTrees = totals?.totalTrees || 0;

    // Species distribution
    const speciesRows = await db.all(
      `SELECT 
        species,
        COUNT(*) as count,
        SUM(biomass) as speciesBiomass,
        SUM(carbon_storage) as speciesCarbon,
        SUM(co2_estimate) as speciesCo2
       FROM project_trees 
       WHERE project_id = ? 
       GROUP BY species 
       ORDER BY count DESC`,
      [id]
    );

    const speciesDistribution = speciesRows.map((s) => ({
      species: s.species,
      count: s.count,
      percentage: totalTrees > 0 ? round((s.count / totalTrees) * 100, 1) : 0,
      carbonKg: round(s.speciesCarbon || 0),
      biomassKg: round(s.speciesBiomass || 0),
      co2Kg: round(s.speciesCo2 || 0),
    }));

    // Generate evidence-based recommendations
    const recommendations = [];
    const dominant = speciesDistribution[0];

    if (dominant && dominant.percentage > 40) {
      recommendations.push({
        title: 'Enhance Canopy Biodiversity Diversity',
        priority: 'High',
        category: 'Ecology',
        description: `Over ${dominant.percentage}% of the current population is ${dominant.species}. Monocultures are vulnerable to pest outbreaks. Introduce complementary native species such as Neem (Azadirachta indica), Peepal (Ficus religiosa), and Jamun (Syzygium cumini) to improve resilience.`,
      });
    }

    if ((totals?.unmappedTrees || 0) > 0) {
      recommendations.push({
        title: 'Georeferencing Data Enrichment',
        priority: 'Medium',
        category: 'Data Quality',
        description: `${totals.unmappedTrees} tree records currently lack precise GPS coordinates. Re-survey these specimens with Epicollect5 mobile handheld GPS to enable full spatial GIS heatmaps.`,
      });
    }

    if (totalTrees > 0 && totalTrees < 150) {
      recommendations.push({
        title: 'Canopy Density & Corridors',
        priority: 'High',
        category: 'Afforestation',
        description: `With ${totalTrees} trees recorded across the project boundary, there is substantial capacity for dense multi-tier urban groves along study perimeter fencing to act as acoustic and dust buffering corridors.`,
      });
    } else {
      recommendations.push({
        title: 'Mature Tree Health & Canopy Preservation',
        priority: 'Medium',
        category: 'Stewardship',
        description: `Maintain annual girth measurement tracking for mature specimens. Priority pruning should focus on deadwood mitigation while preserving nesting habitats for local avifauna and pollinator species.`,
      });
    }

    res.json({
      project: {
        id: project.id,
        name: project.name,
        organization: project.organization,
        city: project.city,
        study_area: project.study_area,
      },
      inventory: {
        totalTrees,
        mappedTrees: totals?.mappedTrees || 0,
        unmappedTrees: totals?.unmappedTrees || 0,
        speciesCount: totals?.speciesCount || 0,
        avgAge: round(totals?.avgAge || 0, 1),
        avgDbh: round(totals?.avgDbh || 0, 1),
        avgHeight: round(totals?.avgHeight || 0, 1),
      },
      environmental: {
        totalBiomassKg: round(totals?.totalBiomass || 0),
        totalBiomassTonnes: round((totals?.totalBiomass || 0) / 1000, 2),
        totalCarbonKg: round(totals?.totalCarbon || 0),
        totalCarbonTonnes: round((totals?.totalCarbon || 0) / 1000, 2),
        totalCo2Kg: round(totals?.totalCo2 || 0),
        totalCo2Tonnes: round((totals?.totalCo2 || 0) / 1000, 2),
        totalOxygenKg: round(totals?.totalOxygen || 0),
        totalOxygenTonnes: round((totals?.totalOxygen || 0) / 1000, 2),
        annualCo2Kg: round((totals?.totalCo2 || 0) / Math.max(1, totals?.avgAge || 20)),
      },
      speciesDistribution,
      recommendations,
    });
  } catch (error) {
    console.error('Error computing project stats:', error);
    res.status(500).json({ error: 'Failed to compute environmental statistics.' });
  }
});

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 11. GET /api/projects/:id/report - Generate comprehensive project report
 * ─────────────────────────────────────────────────────────────────────────────
 */
router.get('/:id/report', async (req, res) => {
  try {
    const { id } = req.params;
    const project = await db.get('SELECT * FROM projects WHERE id = ?', [id]);
    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    const totals = await db.get(
      `SELECT 
        COUNT(*) as totalTrees,
        COUNT(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 END) as mappedTrees,
        COUNT(CASE WHEN latitude IS NULL OR longitude IS NULL THEN 1 END) as unmappedTrees,
        COUNT(DISTINCT species) as speciesCount,
        SUM(biomass) as totalBiomass,
        SUM(carbon_storage) as totalCarbon,
        SUM(co2_estimate) as totalCo2,
        SUM(oxygen_production) as totalOxygen,
        AVG(age) as avgAge,
        AVG(dbh) as avgDbh,
        AVG(height) as avgHeight
       FROM project_trees WHERE project_id = ?`,
      [id]
    );

    const species = await db.all(
      `SELECT species, COUNT(*) as count, SUM(carbon_storage) as carbon 
       FROM project_trees WHERE project_id = ? GROUP BY species ORDER BY count DESC LIMIT 10`,
      [id]
    );

    const report = {
      title: `${project.name} - Tree Inventory & Environmental Audit`,
      generatedAt: new Date().toISOString(),
      project: {
        id: project.id,
        name: project.name,
        organization: project.organization,
        description: project.description,
        location: `${project.city}, ${project.state}, ${project.country}`,
        studyArea: project.study_area,
        coordinator: project.coordinator,
        contactEmail: project.contact_email,
        dataSource: project.data_source,
      },
      summary: {
        totalRecords: totals?.totalTrees || 0,
        mappedTrees: totals?.mappedTrees || 0,
        unmappedTrees: totals?.unmappedTrees || 0,
        speciesCount: totals?.speciesCount || 0,
        totalBiomassTonnes: round((totals?.totalBiomass || 0) / 1000, 2),
        totalCarbonTonnes: round((totals?.totalCarbon || 0) / 1000, 2),
        totalCo2Tonnes: round((totals?.totalCo2 || 0) / 1000, 2),
        totalOxygenTonnes: round((totals?.totalOxygen || 0) / 1000, 2),
        averageAge: round(totals?.avgAge || 0, 1),
        averageDbh: round(totals?.avgDbh || 0, 1),
        averageHeight: round(totals?.avgHeight || 0, 1),
      },
      topSpecies: species.map((s) => ({
        species: s.species,
        count: s.count,
        carbonKg: round(s.carbon || 0),
      })),
      scientificFormulas: [
        {
          name: 'Diameter at Breast Height (DBH)',
          formula: 'DBH (cm) = GBH / π',
          description: 'Calculates standard trunk diameter from field girth at 1.3m height.',
        },
        {
          name: 'Chave Aboveground Biomass (AGB)',
          formula: 'AGB (kg) = 0.0673 × (ρ × DBH² × H)^0.976',
          description: 'Peer-reviewed pantropical allometric model incorporating wood density (ρ), diameter, and tree height.',
        },
        {
          name: 'Stored Carbon Mass',
          formula: 'Carbon (kg) = Biomass × 0.47',
          description: 'IPCC standard stoichiometric factor estimating dry elemental carbon sequestered in lignocellulosic matter.',
        },
        {
          name: 'CO₂ Equivalent Absorption',
          formula: 'CO₂ (kg) = Carbon × (44/12) ≈ Carbon × 3.67',
          description: 'Conversion from elemental carbon to atmospheric carbon dioxide based on molecular weight ratio.',
        },
      ],
    };

    res.json({ report });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate project report.' });
  }
});

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 12. DELETE /api/projects/:id/trees - Clear trees to allow re-import
 * ─────────────────────────────────────────────────────────────────────────────
 */
router.delete('/:id/trees', async (req, res) => {
  try {
    const { id } = req.params;
    await db.run('DELETE FROM project_trees WHERE project_id = ?', [id]);
    res.json({ message: 'All tree observations for this project have been cleared.' });
  } catch (error) {
    console.error('Error clearing project trees:', error);
    res.status(500).json({ error: 'Failed to clear tree records.' });
  }
});

export default router;

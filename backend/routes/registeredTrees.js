import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import db from '../database/connection.js';
import { isMongoReady, ensureMongo } from '../database/mongo.js';
import { RegisteredTree } from '../models/RegisteredTree.js';
import { computeEnvironmentalParameters } from '../services/extendedCalculator.js';
import { buildRegistrationAnalysis } from '../rag/registrationAnalysis.js';
import { resolveSpeciesMeta } from '../rag/speciesCatalog.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsRoot = path.resolve(__dirname, '../uploads/trees');

fs.mkdirSync(uploadsRoot, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsRoot),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image uploads are allowed.'));
    }
    cb(null, true);
  },
});

async function requireMongo(res) {
  const ok = await ensureMongo();
  if (!ok || !isMongoReady()) {
    res.status(503).json({
      detail:
        'MongoDB is not connected. Check MONGODB_URI in backend/.env (Atlas DB: tree_analysis, collection: tree) and Network Access in Atlas.',
    });
    return false;
  }
  return true;
}

function nextTreeId() {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `TR-${stamp}-${rand}`;
}

function imageUrl(filename) {
  if (!filename) return null;
  return `/api/registered-trees/uploads/${path.basename(filename)}`;
}

function serializeTree(doc) {
  const o = doc.toObject ? doc.toObject() : doc;
  return {
    ...o,
    id: o._id,
    images: {
      tree: o.images?.tree ? imageUrl(o.images.tree) : null,
      bark: o.images?.bark ? imageUrl(o.images.bark) : null,
      leaf: o.images?.leaf ? imageUrl(o.images.leaf) : null,
    },
  };
}

async function lookupSpecies(speciesName) {
  return db.get('SELECT * FROM species WHERE name = ? COLLATE NOCASE', [speciesName]);
}

/** Preview calculations + AI analysis without saving (Add Tree persists later). */
router.post('/analyze', async (req, res) => {
  try {
    const {
      species,
      gbh,
      height,
      crownDiameter,
      age,
      latitude,
      longitude,
    } = req.body || {};

    if (!species || gbh == null || height == null) {
      return res.status(400).json({ detail: 'species, gbh, and height are required.' });
    }
    const lat = (latitude != null && latitude !== '') ? Number(latitude) : null;
    const lng = (longitude != null && longitude !== '') ? Number(longitude) : null;
    if (lat != null && (!Number.isFinite(lat) || lat < -90 || lat > 90)) {
      return res.status(400).json({ detail: 'Latitude must be between -90 and 90.' });
    }
    if (lng != null && (!Number.isFinite(lng) || lng < -180 || lng > 180)) {
      return res.status(400).json({ detail: 'Longitude must be between -180 and 180.' });
    }

    const speciesRow = await lookupSpecies(species);
    if (!speciesRow) {
      return res.status(404).json({ detail: `Species '${species}' not found.` });
    }

    const calculations = computeEnvironmentalParameters({
      speciesRow,
      gbh: Number(gbh),
      height: Number(height),
      crownDiameter: crownDiameter != null && crownDiameter !== '' ? Number(crownDiameter) : null,
      ageOverride: age != null && age !== '' ? Number(age) : null,
    });

    const meta = resolveSpeciesMeta(species);
    const climaticAnalysis = buildRegistrationAnalysis(species, calculations);

    return res.json({
      species: speciesRow.name,
      scientificName: meta.scientific,
      family: meta.family,
      commonName: meta.common,
      latitude: lat,
      longitude: lng,
      calculations,
      climaticAnalysis,
      biodiversity: climaticAnalysis.biodiversity,
      medicinalValue: climaticAnalysis.medicinalValue,
      canopyAnalysis: climaticAnalysis.canopyAnalysis,
      culturalImportance: climaticAnalysis.culturalImportance,
      pollutionControl: climaticAnalysis.pollutionControl,
      climateResilience: climaticAnalysis.climateResilience,
      conservationStatus: climaticAnalysis.conservationStatus,
      maintenance: climaticAnalysis.maintenance,
      analysisSource: 'local-rag',
    });
  } catch (err) {
    console.error('registered-trees/analyze error:', err);
    return res.status(500).json({ detail: err.message || 'Analysis failed.' });
  }
});

/** Persist complete tree record + optional images. */
router.post(
  '/',
  upload.fields([
    { name: 'treeImage', maxCount: 1 },
    { name: 'barkImage', maxCount: 1 },
    { name: 'leafImage', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      if (!(await requireMongo(res))) return;

      const body = req.body || {};
      const latitude = Number(body.latitude);
      const longitude = Number(body.longitude);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return res.status(400).json({ detail: 'Please capture the tree location before saving.' });
      }
      if (!body.species || body.gbh == null || body.height == null) {
        return res.status(400).json({ detail: 'species, gbh, and height are required.' });
      }

      const speciesRow = await lookupSpecies(body.species);
      if (!speciesRow) {
        return res.status(404).json({ detail: `Species '${body.species}' not found.` });
      }

      let calculations;
      let climaticAnalysis;
      let analysisSource = 'local-rag';

      if (body.calculationsJson && body.climaticAnalysisJson) {
        calculations = JSON.parse(body.calculationsJson);
        climaticAnalysis = JSON.parse(body.climaticAnalysisJson);
        analysisSource = body.analysisSource || 'local-rag';
      } else {
        calculations = computeEnvironmentalParameters({
          speciesRow,
          gbh: Number(body.gbh),
          height: Number(body.height),
          crownDiameter: body.crownDiameter ? Number(body.crownDiameter) : null,
          ageOverride: body.age ? Number(body.age) : null,
        });
        climaticAnalysis = buildRegistrationAnalysis(body.species, calculations);
      }

      const meta = resolveSpeciesMeta(body.species);
      const treeId = body.treeId || nextTreeId();

      const images = {
        tree: req.files?.treeImage?.[0]?.filename || null,
        bark: req.files?.barkImage?.[0]?.filename || null,
        leaf: req.files?.leafImage?.[0]?.filename || null,
      };

      const doc = await RegisteredTree.create({
        treeId,
        treeName: body.treeName || body.commonName || meta.common,
        species: speciesRow.name,
        scientificName: body.scientificName || meta.scientific,
        family: body.family || meta.family,
        commonName: body.commonName || meta.common,
        age: calculations.age,
        height: calculations.height,
        dbh: calculations.dbh,
        gbh: Number(body.gbh),
        crownDiameter: calculations.crownDiameter,
        healthStatus: body.healthStatus || 'Healthy',
        latitude,
        longitude,
        address: body.address || '',
        ward: body.ward || '',
        zone: body.zone || '',
        measurements: {
          gbh: Number(body.gbh),
          height: Number(body.height),
          crownDiameter: body.crownDiameter ? Number(body.crownDiameter) : calculations.crownDiameter,
          dbh: calculations.dbh,
          age: calculations.age,
        },
        calculations,
        climaticAnalysis,
        biodiversity: climaticAnalysis.biodiversity,
        medicinalValue: climaticAnalysis.medicinalValue,
        canopyAnalysis: climaticAnalysis.canopyAnalysis,
        culturalImportance: climaticAnalysis.culturalImportance,
        pollutionControl: climaticAnalysis.pollutionControl,
        climateResilience: climaticAnalysis.climateResilience,
        conservationStatus: climaticAnalysis.conservationStatus,
        maintenance: climaticAnalysis.maintenance,
        images,
        analysisGeneratedAt: new Date(),
        analysisSource,
      });

      console.log(
        `Tree saved → MongoDB db="${mongoose.connection.name}" collection="tree" treeId=${doc.treeId}`
      );
      return res.status(201).json(serializeTree(doc));
    } catch (err) {
      console.error('registered-trees create error:', err);
      return res.status(500).json({ detail: err.message || 'Failed to save tree.' });
    }
  }
);

router.get('/', async (_req, res) => {
  try {
    if (!(await requireMongo(res))) return;
    const trees = await RegisteredTree.find().sort({ createdAt: -1 }).lean();
    return res.json(trees.map((t) => serializeTree(t)));
  } catch (err) {
    return res.status(500).json({ detail: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    if (!(await requireMongo(res))) return;
    const tree =
      (await RegisteredTree.findById(req.params.id).catch(() => null)) ||
      (await RegisteredTree.findOne({ treeId: req.params.id }));
    if (!tree) return res.status(404).json({ detail: 'Tree not found.' });
    return res.json(serializeTree(tree));
  } catch (err) {
    return res.status(500).json({ detail: err.message });
  }
});

/** Explicit regeneration only — never called automatically on details view. */
router.post('/:id/regenerate-analysis', async (req, res) => {
  try {
    if (!(await requireMongo(res))) return;
    const tree =
      (await RegisteredTree.findById(req.params.id).catch(() => null)) ||
      (await RegisteredTree.findOne({ treeId: req.params.id }));
    if (!tree) return res.status(404).json({ detail: 'Tree not found.' });

    const climaticAnalysis = buildRegistrationAnalysis(tree.species, tree.calculations);
    tree.climaticAnalysis = climaticAnalysis;
    tree.biodiversity = climaticAnalysis.biodiversity;
    tree.medicinalValue = climaticAnalysis.medicinalValue;
    tree.canopyAnalysis = climaticAnalysis.canopyAnalysis;
    tree.culturalImportance = climaticAnalysis.culturalImportance;
    tree.pollutionControl = climaticAnalysis.pollutionControl;
    tree.climateResilience = climaticAnalysis.climateResilience;
    tree.conservationStatus = climaticAnalysis.conservationStatus;
    tree.maintenance = climaticAnalysis.maintenance;
    tree.analysisGeneratedAt = new Date();
    tree.analysisSource = 'local-rag-regenerated';
    await tree.save();
    return res.json(serializeTree(tree));
  } catch (err) {
    return res.status(500).json({ detail: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    if (!(await requireMongo(res))) return;
    const tree =
      (await RegisteredTree.findById(req.params.id).catch(() => null)) ||
      (await RegisteredTree.findOne({ treeId: req.params.id }));
    if (!tree) return res.status(404).json({ detail: 'Tree not found.' });

    for (const key of ['tree', 'bark', 'leaf']) {
      const file = tree.images?.[key];
      if (file) {
        const full = path.join(uploadsRoot, path.basename(file));
        if (fs.existsSync(full)) fs.unlinkSync(full);
      }
    }

    await tree.deleteOne();
    return res.json({ ok: true, treeId: tree.treeId });
  } catch (err) {
    return res.status(500).json({ detail: err.message });
  }
});

export { uploadsRoot };
export default router;

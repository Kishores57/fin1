import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { RegisteredTree } from '../models/RegisteredTree.js';
import { isMongoReady, ensureMongo } from '../database/mongo.js';
import { estimateTreeAge } from '../routes/epicollect.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Loads and unifies all tree records from both MongoDB and Epicollect local fallback
 * Returns an array of unified tree objects with validated coordinates.
 */
export async function getAllUnifiedTrees() {
  const unified = [];
  const seenIds = new Set();

  // 1. Fetch MongoDB Registered Trees
  try {
    await ensureMongo();
    if (isMongoReady()) {
      const mongoDocs = await RegisteredTree.find({}).lean();
      for (const doc of mongoDocs) {
        const id = doc.treeId || String(doc._id);
        const lat = parseFloat(doc.latitude);
        const lng = parseFloat(doc.longitude);

        if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          if (!seenIds.has(id)) {
            seenIds.add(id);
            unified.push({
              id,
              treeId: doc.treeId,
              source: 'mongodb',
              species: doc.species || 'Unknown',
              scientificName: doc.scientificName || '',
              height: doc.height || null,
              gbh: doc.gbh || null,
              dbh: doc.dbh || (doc.gbh ? Number(doc.gbh) / Math.PI : null),
              age: doc.gbh ? estimateTreeAge(doc.gbh, doc.species) : (doc.age && doc.age <= 28 ? Number(doc.age) : 22),
              healthStatus: doc.healthStatus || 'Healthy',
              lat,
              lng,
              createdAt: doc.createdAt,
            });
          }
        }
      }
    }
  } catch (err) {
    console.warn('Unified tree loader: Mongo trees fetch warning:', err.message);
  }

  // 2. Fetch Epicollect / Local Survey Dataset
  const surveyDataPath = path.resolve(__dirname, '../data/parsed_trees.json');
  if (fs.existsSync(surveyDataPath)) {
    try {
      const raw = JSON.parse(fs.readFileSync(surveyDataPath, 'utf-8'));
        for (const item of raw) {
          const id = `EPIC-${item.id}`;
          const lat = parseFloat(item.lat);
          const lng = parseFloat(item.lng);

          if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            if (!seenIds.has(id)) {
              seenIds.add(id);
              unified.push({
                id,
                treeId: `EPIC-${item.id}`,
                source: 'epicollect-survey',
                species: item.species || 'Unknown',
                scientificName: '',
                height: item.height || null,
                gbh: item.circumference || null,
                dbh: item.circumference ? (item.circumference / Math.PI) : null,
                age: item.circumference ? estimateTreeAge(item.circumference, item.species) : (item.age && item.age <= 28 ? Number(item.age) : 22),
                healthStatus: 'Healthy',
                impact: item.impact || 'Normal',
                lat,
                lng,
                createdAt: item.date || null,
              });
            }
          }
        }
      } catch (e) {
        console.warn('Error reading survey trees in unified loader:', e.message);
      }
    }

  return unified;
}

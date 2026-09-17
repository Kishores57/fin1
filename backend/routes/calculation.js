import express from 'express';
import db from '../database/connection.js';
import { CalculatorService } from '../services/calculator.js';
import { ragService } from '../rag/service.js';

const router = express.Router();
/** Preferred calculator dropdown order */
const CALCULATOR_SPECIES_ORDER = [
  'Bamboo',
  'Christmas',
  'Palm (Bottle Palm)',
  'Coconut',
  'Ashoka',
  'Tej Patta',
  'Badam',
  'Rain Tree',
  'Silver Oak',
  'Mango',
  'Supari',
  'Ad',
  'Bel',
];

/**
 * GET /api/species
 * Retrieves list of registered tree species constants from database.
 */
router.get('/species', async (req, res) => {
  try {
    const speciesList = await db.all('SELECT * FROM species ORDER BY name ASC');
    const byName = new Map(
      speciesList.map((sp) => [String(sp.name).toLowerCase(), sp])
    );
    const ordered = CALCULATOR_SPECIES_ORDER
      .map((name) => byName.get(name.toLowerCase()))
      .filter(Boolean);
    res.json(ordered.length > 0 ? ordered : speciesList);
  } catch (error) {
    console.error('Failed to fetch species:', error);
    res.status(500).json({ detail: `Failed to fetch species list: ${error.message}` });
  }
});

/**
 * POST /api/calculate
 * Sends tree measurements to the backend calculation and RAG pipeline.
 */
router.post('/calculate', async (req, res) => {
  const { species, gbh, height, latitude, longitude } = req.body;

  if (!species || gbh === undefined || height === undefined) {
    return res.status(400).json({ detail: 'species, gbh, and height are required.' });
  }

  const parsedGbh = parseFloat(gbh);
  const parsedHeight = parseFloat(height);

  if (isNaN(parsedGbh) || parsedGbh <= 0) {
    return res.status(400).json({ detail: 'Girth (gbh) must be greater than zero.' });
  }
  if (isNaN(parsedHeight) || parsedHeight <= 0) {
    return res.status(400).json({ detail: 'Height must be greater than zero.' });
  }

  try {
    // 1. Fetch species details (case-insensitive)
    const speciesRow = await db.get(
      'SELECT * FROM species WHERE name = ? COLLATE NOCASE',
      [species]
    );

    if (!speciesRow) {
      return res.status(400).json({ detail: `Species '${species}' is not registered in the database.` });
    }

    // 2. Run allometric and environmental metrics calculations
    const calcResults = CalculatorService.processTreeCalculations(
      speciesRow,
      parsedGbh,
      parsedHeight
    );

    const speciesName = calcResults.species_name;

    const latVal = latitude !== undefined && latitude !== null ? parseFloat(latitude) : null;
    const lngVal = longitude !== undefined && longitude !== null ? parseFloat(longitude) : null;

    // 3. Local-first summaries (offline packs for project review demos)
    console.log(`Building climatic analysis for selected species: ${speciesName} (local packs first)`);

    const climateSummary = await ragService.generateSummary(
      speciesName,
      calcResults.age,
      calcResults.biomass,
      calcResults.carbon,
      calcResults.co2,
      latVal,
      lngVal,
      null
    );

    const medicinalSummary = await ragService.generateMedicinalSummary(speciesName, null);
    const habitatSummary = await ragService.generateHabitatSummary(speciesName, null);

    // 4. Create new Tree database record and persist it

    const result = await db.run(
      `INSERT INTO trees (
        species_id, gbh, height, dbh, age, biomass, carbon, co2, oxygen, 
        summary, medicinal_impact, habitat_support, latitude, longitude
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        calcResults.species_id,
        parsedGbh,
        parsedHeight,
        calcResults.dbh,
        calcResults.age,
        calcResults.biomass,
        calcResults.carbon,
        calcResults.co2,
        calcResults.oxygen,
        climateSummary,
        medicinalSummary,
        habitatSummary,
        latVal,
        lngVal,
      ]
    );

    // 5. Retrieve the inserted tree record joined with species name for Pydantic response contract
    const newTree = await db.get(
      `SELECT t.*, s.name as species_name
       FROM trees t
       JOIN species s ON t.species_id = s.id
       WHERE t.id = ?`,
      [result.id]
    );

    res.status(201).json(newTree);
  } catch (error) {
    console.error('Calculation error:', error);
    res.status(500).json({ detail: `Calculation error: ${error.message}` });
  }
});

/**
 * GET /api/history
 * Retrieves the historical database of logged trees.
 */
router.get('/history', async (req, res) => {
  try {
    const trees = await db.all(
      `SELECT t.*, s.name as species_name
       FROM trees t
       JOIN species s ON t.species_id = s.id
       ORDER BY t.created_at DESC`
    );
    res.json(trees);
  } catch (error) {
    console.error('Failed to fetch history:', error);
    res.status(500).json({ detail: `Failed to fetch history: ${error.message}` });
  }
});

export default router;

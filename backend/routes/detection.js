import express from 'express';
import multer from 'multer';
import db from '../database/connection.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

const DETECTION_SERVICE_URL = process.env.DETECTION_URL || 'http://127.0.0.1:5000';

/**
 * Health check for the AI Species & Bark Age Detection models
 */
router.get('/health', async (_req, res) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const response = await fetch(`${DETECTION_SERVICE_URL}/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      return res.status(response.status).json({ status: 'unhealthy', model_loaded: false, species_model_loaded: false, age_model_loaded: false });
    }
    const data = await response.json();
    return res.json(data);
  } catch (err) {
    return res.json({
      status: 'offline',
      model_loaded: false,
      species_model_loaded: false,
      age_model_loaded: false,
      message: 'TreeVisionAI detection service is not currently reachable.',
    });
  }
});

/**
 * Predict species from uploaded leaf/foliage image
 */
router.post('/predict', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided in "file" field.' });
  }

  try {
    const formData = new FormData();
    const blob = new Blob([req.file.buffer], { type: req.file.mimetype || 'image/jpeg' });
    formData.append('file', blob, req.file.originalname || 'upload.jpg');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const pyResponse = await fetch(`${DETECTION_SERVICE_URL}/predict`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!pyResponse.ok) {
      const errText = await pyResponse.text();
      return res.status(pyResponse.status).json({
        error: `Model service error: ${errText}`,
        fallback: true,
      });
    }

    const data = await pyResponse.json();
    return res.json(data);
  } catch (err) {
    console.warn('Species detection proxy error:', err.message);
    return res.json({
      error: 'AI Species detection service is offline or timed out.',
      message: 'Run "python main.py" in backend/species_detection or set DETECTION_URL environment variable.',
      fallback: true,
    });
  }
});

/**
 * Predict tree age from bark texture image + species growth rate (MAI) and DBH/GBH
 */
router.post('/predict-age', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No bark image file provided in "file" field.' });
  }

  const { species, dbh, gbh } = req.body;
  let growthRate = req.body.growth_rate;

  // If species is provided but growth_rate is not, look up species MAI in SQLite database
  if (!growthRate && species) {
    try {
      const row = await db.get(
        'SELECT mai FROM species WHERE name = ? COLLATE NOCASE',
        [species.trim()]
      );
      if (row && row.mai) {
        growthRate = row.mai;
      }
    } catch (e) {
      console.warn('Species lookup for MAI error:', e.message);
    }
  }

  try {
    const formData = new FormData();
    const blob = new Blob([req.file.buffer], { type: req.file.mimetype || 'image/jpeg' });
    formData.append('file', blob, req.file.originalname || 'bark_upload.jpg');
    if (species) formData.append('species', species);
    if (dbh) formData.append('dbh', String(dbh));
    if (gbh) formData.append('gbh', String(gbh));
    if (growthRate) formData.append('growth_rate', String(growthRate));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const pyResponse = await fetch(`${DETECTION_SERVICE_URL}/predict-age`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!pyResponse.ok) {
      const errText = await pyResponse.text();
      return res.status(pyResponse.status).json({
        error: `Age model service error: ${errText}`,
        fallback: true,
      });
    }

    const data = await pyResponse.json();
    return res.json(data);
  } catch (err) {
    console.warn('Bark age detection proxy error:', err.message);

    // Fallback: If AI server is offline, calculate analytical age using DBH and MAI if available
    let fallbackDbh = null;
    if (dbh && Number(dbh) > 0) {
      fallbackDbh = Number(dbh);
    } else if (gbh && Number(gbh) > 0) {
      fallbackDbh = Number((Number(gbh) / Math.PI).toFixed(1));
    }

    const maiNum = growthRate ? Number(growthRate) : 1.20;
    let fallbackAge = null;
    if (fallbackDbh && maiNum > 0) {
      fallbackAge = Number((fallbackDbh / maiNum).toFixed(1));
    }

    return res.json({
      fallback: true,
      error: 'Bark age AI server is offline. Analytical allometric estimate used.',
      message: 'Run "python main.py" in backend/species_detection for deep neural network bark classification.',
      approximate_age: fallbackAge,
      growth_age: fallbackAge,
      dbh: fallbackDbh,
      growth_rate_mai: maiNum,
      species: species || 'Unknown',
      stage_label: fallbackAge ? (fallbackAge < 5 ? 'Sapling' : fallbackAge < 15 ? 'Young' : fallbackAge < 40 ? 'Mature' : 'Old (Veteran)') : 'Estimated',
      age_range: fallbackAge ? (fallbackAge < 5 ? '0 – 5 years' : fallbackAge < 15 ? '5 – 15 years' : fallbackAge < 40 ? '15 – 40 years' : '40+ years') : '—',
      confidence: 70.0,
      comparison_summary: fallbackAge
        ? `Analytical allometric estimate based on DBH (${fallbackDbh} cm) and ${species || 'standard'} growth rate (${maiNum} cm/yr). Start the Python AI service for deep bark neural texture analysis.`
        : 'Please start the Python detection service ("python main.py" in backend/species_detection) or provide GBH/DBH.',
    });
  }
});

export default router;


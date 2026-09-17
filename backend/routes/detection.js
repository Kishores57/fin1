import express from 'express';
import multer from 'multer';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

const DETECTION_SERVICE_URL = process.env.DETECTION_URL || 'http://127.0.0.1:5000';

/**
 * Health check for the AI Species Detection model
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
      return res.status(response.status).json({ status: 'unhealthy', model_loaded: false });
    }
    const data = await response.json();
    return res.json(data);
  } catch (err) {
    return res.json({
      status: 'offline',
      model_loaded: false,
      message: 'Species detection service is not currently reachable.',
    });
  }
});

/**
 * Predict species from uploaded leaf/bark image
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

export default router;

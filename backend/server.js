import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { settings } from './config.js';
import { initDb } from './database/initDb.js';
import { connectMongo } from './database/mongo.js';
import { ingestDocuments } from './rag/service.js';
import calculationRouter from './routes/calculation.js';
import epicollectRouter from './routes/epicollect.js';
import registeredTreesRouter, { uploadsRoot } from './routes/registeredTrees.js';
import detectionRouter from './routes/detection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDist = path.resolve(__dirname, '../frontend/dist');

const app = express();

// Apply CORS middleware (configurable via environment, default open for dev & multi-host deploy)
const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*';
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Apply body parser middleware
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Mount API routes
app.use('/api', calculationRouter);
app.use('/api/epicollect', epicollectRouter);
app.use('/api/detection', detectionRouter);

// Additive MongoDB tree-registration module (does not replace SQLite calculator)
app.use('/api/registered-trees/uploads', express.static(uploadsRoot));
app.use('/api/registered-trees', registeredTreesRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Production Single-Service Deployment: Serve compiled React frontend if present
if (fs.existsSync(frontendDist)) {
  console.log(`Serving static production frontend from ${frontendDist}`);
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
} else {
  // Root endpoint fallback for API-only deployment
  app.get('/', (req, res) => {
    res.json({
      message: 'Welcome to the AI-Powered GIS Tree Inventory and Climate Impact Analysis System API',
      status: 'online',
      endpoints: {
        health: '/api/health',
        species: '/api/species',
        calculate: '/api/calculate',
        history: '/api/history',
        epicollect: '/api/epicollect/trees',
        registeredTrees: '/api/registered-trees',
        detection: '/api/detection/predict',
      },
    });
  });
}

// Initialize database, run RAG ingestion, and start server
async function start() {
  try {
    await initDb();
    await ingestDocuments();
    // Mongo is additive — failure does not stop the existing SQLite calculator
    await connectMongo();

    const server = app.listen(settings.PORT, () => {
      console.log(`Backend server successfully running on port ${settings.PORT}`);
    });

    // Graceful shutdown for containers / cloud platforms
    const shutdown = () => {
      console.log('Received termination signal, shutting down server gracefully...');
      server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
      });
    };
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (err) {
    console.error('Server startup failed:', err);
    process.exit(1);
  }
}

start();

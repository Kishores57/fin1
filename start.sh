#!/bin/sh
set -e

echo "Starting TreeVisionAI PyTorch Model Service on port 5000..."
DETECTION_PORT=5000 python3 /app/backend/species_detection/main.py &

echo "Starting VanJeevan Node.js Server on port ${PORT:-8000}..."
exec node --max-old-space-size=256 /app/backend/server.js

#!/bin/sh
set -e

echo "=========================================================="
echo " Starting TreeVisionAI PyTorch Model Service on port 5000"
echo "=========================================================="

export DETECTION_PORT=5000
python3 /app/backend/species_detection/main.py &

# Brief pause to let model load into memory
sleep 2

echo "=========================================================="
echo " Starting VanJeevan Node.js Server on port ${PORT:-8000}"
echo "=========================================================="

exec node /app/backend/server.js

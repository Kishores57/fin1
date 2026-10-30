# Stage 1: Build Frontend Assets
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Production Unified Server with PyTorch AI Model
FROM node:22-bookworm-slim
WORKDIR /app

# Install Python3, pip, and venv in Debian Bookworm
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    && rm -rf /var/lib/apt/lists/*

# Setup virtual environment
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install lightweight CPU-only PyTorch & model dependencies (~150MB instead of 2.5GB CUDA)
RUN pip install --no-cache-dir --extra-index-url https://download.pytorch.org/whl/cpu torch torchvision
RUN pip install --no-cache-dir fastapi uvicorn python-multipart pillow

# Install backend Node.js dependencies
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm install --omit=dev

# Copy backend source, neural network models (best_model.pth, tree_age_efficientnet_b4.pth)
WORKDIR /app
COPY backend/ /app/backend/

# Copy compiled frontend assets for single-service hosting
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Copy container startup orchestrator
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Environment settings
ENV NODE_ENV=production
ENV PORT=8000
ENV DETECTION_URL=http://127.0.0.1:5000
EXPOSE 8000

# Launch both PyTorch model service and Node backend
CMD ["/app/start.sh"]

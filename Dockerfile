# Stage 1: Build Frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Production Backend Server
FROM node:22-alpine
WORKDIR /app

# Install backend dependencies
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm install --omit=dev

# Copy backend source
COPY backend/ /app/backend/

# Copy built frontend assets to frontend/dist for single-service hosting
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Default environment
ENV NODE_ENV=production
ENV PORT=8000
EXPOSE 8000

# Start server
CMD ["node", "server.js"]

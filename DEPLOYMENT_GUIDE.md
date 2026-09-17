# 🚀 Production Deployment & Maintenance Guide

This project is configured for seamless deployment to modern cloud platforms (Render, Railway, Vercel, Docker, AWS, etc.).

---

## 🏗️ Architecture Overview

The system consists of 3 integrated layers:
1. **Frontend**: React + Vite SPA (in `frontend/`)
2. **Backend**: Node.js + Express + SQLite + MongoDB (in `backend/`)
3. **AI Species Detection Service**: Python FastAPI + PyTorch EfficientNet (in `backend/species_detection/`)

---

## 🌐 Deployment Options

### Option 1: Single-Service Full Stack (Recommended for Render / Railway)

Both the React frontend and Express backend can be built and served as a single service. When the backend starts in production, it automatically serves the compiled frontend from `frontend/dist`.

1. **Push your code to GitHub**.
2. **Create a new Web Service** on [Render](https://render.com) or [Railway](https://railway.app) connected to your GitHub repo.
3. Configure the settings:
   - **Environment**: Node
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
4. Add your **Environment Variables** in the platform dashboard:
   - `PORT`: `8000` (or leave default, platform assigns one)
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: `mongodb+srv://...`
   - `GEMINI_API_KEY`: `your-gemini-api-key`
   - `DATABASE_URL`: `sqlite:///./tree_analysis.db`
   - `EPICOLLECT_PROJECT_SLUG`: `vanjeevan`
   - `EPICOLLECT_CLIENT_ID`: `your-epicollect-client-id`
   - `EPICOLLECT_CLIENT_SECRET`: `your-epicollect-client-secret`
   - `DETECTION_URL`: *(Optional)* URL of your deployed Python species detection service.

---

### Option 2: Split Deployment (Vercel Frontend + Render Backend)

#### A. Deploy Backend on Render / Railway:
- **Root Directory**: `backend`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- Add your backend environment variables from `.env.example`.
- Copy your live backend URL (e.g. `https://your-backend.onrender.com`).

#### B. Deploy Frontend on Vercel / Netlify:
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variable**:
  - `VITE_API_URL`: `https://your-backend.onrender.com`

---

### Option 3: Deploying the AI Species Detection Model (Python)

If you want the AI leaf/bark image recognition running in production:

1. **On Render / Railway / Fly.io**:
   - **Root Directory**: `backend/species_detection`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python main.py`
   - **Environment Variable**: `PORT`: `5000` (or platform default)
2. In your Node.js backend environment variables, set:
   - `DETECTION_URL`: `https://your-species-model.onrender.com`
3. *Graceful Fallback*: If the AI Python service is not running or offline, the platform handles it gracefully without crashing!

---

### Option 4: Docker & Docker-Compose (1-Command Cloud VM / AWS / DigitalOcean)

To run the complete platform including the AI model service in one command:

```bash
# 1. Copy and configure environment variables
cp .env.example .env

# 2. Build and run all containers
docker-compose up --build -d
```

- **Frontend & Backend**: `http://localhost:8000`
- **AI Species Detection API**: `http://localhost:5000`

---

## 🛠️ Making Changes Later

### 1. Adding New Tree Species or Updating Allometrics
- **Species Database Constants**: Edit `backend/database/initDb.js` (`CALCULATOR_SPECIES`).
- **Growth Rates (MAI) & Botanical Names**: Edit `frontend/src/components/MapDashboard.jsx` (`MAI_VALUES`, `BOTANICAL_NAMES`).
- **RAG Scientific Summaries**: Add or modify species files in `backend/rag/localSpeciesPacks.js`.

### 2. Updating AI Species Detection Model
- To use a newly trained model, place the `.pth` file into `backend/models/best_model.pth`.
- Update class labels in `backend/species_detection/main.py` (`CLASS_NAMES`, `SPECIES_META`).

### 3. Adding New Laws, Penalties, or Location Rules
- Edit `frontend/src/components/TreeReportPrint.jsx` (`TREE_LAWS`, `LOCATION_CONTEXT`).
- Changes will immediately reflect on the web report and printable PDF output.

### 4. Local Development (All Services in 1 Click)
Double-click `start_all.bat` on Windows to launch all 3 services concurrently in separate terminals.

@echo off
title Tree Analysis - Launcher
echo ===================================================
echo     Starting All Tree Analysis Project Services
echo ===================================================

echo [1/3] Starting AI Species Detection Model on Port 5000...
start "AI Species Detection (Port 5000)" cmd /k "cd /d %~dp0backend\species_detection && venv\Scripts\activate && python main.py"

echo [2/3] Starting Node.js Backend on Port 8000...
start "Backend Server (Port 8000)" cmd /k "cd /d %~dp0backend && npm run dev"

echo [3/3] Starting React Frontend on Port 5173...
start "Frontend (Port 5173)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ===================================================
echo All 3 services are launching in separate windows!
echo - Frontend: http://localhost:5173
echo - Backend:  http://localhost:8000
echo - AI Model: http://localhost:5000
echo ===================================================
timeout /t 5

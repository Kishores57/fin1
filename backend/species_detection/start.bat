@echo off
echo ========================================================
echo   TreeVisionAI Species & Bark Age Detection Server
echo ========================================================
echo.

cd /d "%~dp0"

if not exist venv\Scripts\activate.bat (
    echo Virtual environment not found. Running setup.bat...
    call setup.bat
    exit /b
)

call venv\Scripts\activate.bat
echo Starting FastAPI model server on http://localhost:5000 ...
python main.py
pause

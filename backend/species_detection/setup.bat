@echo off
echo ============================================
echo   TreeVisionAI Species Detection Setup
echo ============================================
echo.

cd /d "%~dp0"

echo [1/3] Creating Python virtual environment...
python -m venv venv
if %ERRORLEVEL% neq 0 (
    echo ERROR: Python not found. Please install Python 3.10+ first.
    pause
    exit /b 1
)

echo [2/3] Installing dependencies...
call venv\Scripts\activate
pip install -r requirements.txt

echo [3/3] Starting species detection server on port 5000...
echo.
echo ============================================
echo   Server running at http://localhost:5000
echo   Press Ctrl+C to stop
echo ============================================
echo.
python main.py

pause

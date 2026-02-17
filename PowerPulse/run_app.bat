@echo off
echo Starting PowerPulse...

:: Start Backend
start "PowerPulse Backend" cmd /k "call .venv\Scripts\activate && cd src && python -m uvicorn powerpulse.api:app --reload --host 127.0.0.1 --port 8000"

:: Start Frontend
start "PowerPulse Frontend" cmd /k "cd frontend && npm run dev"

echo Backend and Frontend are launching in new windows.
pause

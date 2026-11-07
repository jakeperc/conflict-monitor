@echo off
cd /d "%~dp0"
echo Starting Conflict Monitor on http://localhost:3000 ...
start "" cmd /k "npx serve . --listen 3000"
timeout /t 2 /nobreak > nul
start "" "http://localhost:3000"

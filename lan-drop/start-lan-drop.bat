@echo off
cd /d "%~dp0"
start "LAN Drop Server" /b node server.js
timeout /t 2 /nobreak > nul
start "" "http://localhost:8787"
echo LAN Drop is running. Close this window to stop it.
pause

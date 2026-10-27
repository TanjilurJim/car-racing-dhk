@echo off
title Dhaka Street Rush - ঢাকা রেসার 3D (LAN Multiplayer)
cd /d "%~dp0"

echo =================================================================
echo   🏎️  DHAKA CITY 3D - ঢাকা রেসার ৩ডি (LAN & SINGLE PLAYER)
echo =================================================================

where node >nul 2>nul
if %ERRORLEVEL% equ 0 (
  echo [OK] Node.js detected! Starting LAN Multiplayer Server...
  start "Dhaka 3D LAN Server" cmd /k "cd /d "%~dp0" && node server.js"
  timeout /t 2 >nul
  echo Opening game at http://localhost:3000 ...
  start "" "http://localhost:3000"
) else (
  echo [NOTE] Node.js not found in PATH. Launching local offline 3D mode...
  start "" "%~dp0index.html"
)

echo Game launched! Enjoy racing and ramming through 3D Dhaka roads!
timeout /t 3 >nul
exit

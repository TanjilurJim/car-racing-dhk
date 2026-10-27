@echo off
title Dhaka 3D LAN Server (Port 3000)
cd /d "%~dp0"

echo =================================================================
echo   🏎️  DHAKA CITY 3D - DEDICATED LAN MULTIPLAYER SERVER
echo =================================================================
echo   Keep this window open while playing on PC or with friends on Wi-Fi!
echo   Friends can connect via the Wi-Fi / LAN IP shown below.
echo =================================================================
echo.

where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
  echo [ERROR] Node.js is not found on your PC.
  echo Please install Node.js from https://nodejs.org
  pause
  exit /b 1
)

node server.js

echo.
echo Server stopped. Press any key to close this window.
pause >nul

@echo off
title Dhaka Street Rush - ঢাকা রেসার 3D
cd /d "%~dp0"

echo =================================================================
echo   🏎️  DHAKA CITY 3D - ঢাকা রেসার ৩ডি
echo =================================================================
echo.

where node >nul 2>nul
if %ERRORLEVEL% equ 0 (
  echo [OK] Node.js detected! Starting Multiplayer LAN Server...
  
  :: Check if server is already running on port 3000
  netstat -ano | findstr :3000 >nul 2>nul
  if %ERRORLEVEL% neq 0 (
    start "Dhaka 3D LAN Server" node server.js
    timeout /t 2 >nul
  ) else (
    echo Server is already active on port 3000!
  )

  echo Opening game at http://localhost:3000 ...
  start "" "http://localhost:3000"
) else (
  echo [NOTE] Node.js not found. Opening direct offline 3D mode...
  start "" "%~dp0index.html"
)

echo.
echo =================================================================
echo   Game launched! Enjoy racing on Dhaka roads!
echo   To play with friends on your Wi-Fi, share the LAN URL shown.
echo =================================================================
timeout /t 4 >nul
exit

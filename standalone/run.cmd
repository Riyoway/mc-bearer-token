@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
title Minecraft Bearer Token

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo [ERROR] Node.js was not found.
  echo Install Node.js 20 or later and run this file again.
  echo.
  pause
  exit /b 1
)

if not exist "node_modules\playwright-core\package.json" (
  echo.
  echo [SETUP] Installing the pinned local dependency...
  echo.
  call npm ci --no-audit --no-fund
  if errorlevel 1 (
    echo.
    echo [ERROR] npm ci failed.
    echo.
    pause
    exit /b 1
  )
  cls
)

node src\index.mjs
if errorlevel 1 (
  echo.
  pause
)

endlocal

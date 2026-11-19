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

rem Reinstall if the pinned dependency is missing or out of date.
node -e "const expected = require('./package.json').dependencies['playwright-core']; const locked = require('./package-lock.json').packages['node_modules/playwright-core'].version; const installed = require('./node_modules/playwright-core/package.json').version; process.exit(expected === locked && locked === installed ? 0 : 1)" >nul 2>nul
if errorlevel 1 (
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

@echo off
REM Event Management System - Complete Startup Script
REM Starts: MongoDB + Backend (Node.js) + Frontend (HTTP Server)

setlocal enabledelayedexpansion

echo.
echo ======================================================
echo   Event Management System - Complete Startup
echo ======================================================
echo.

REM Create log file
set "LOGFILE=%~dp0startup.log"
echo [%date% %time%] Starting Event Management System >> "%LOGFILE%"

REM ====== Prerequisites Check ======
echo Checking prerequisites...
echo.

REM Check Node.js
where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found!
    echo Install from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do echo [OK] Node.js: %%i
echo.

REM Check npm
where npm >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm not found!
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm --version') do echo [OK] npm: %%i
echo.

REM ====== MongoDB Check ======
echo ======================================================
echo   Checking MongoDB...
echo ======================================================
echo.

netstat -ano | findstr :27017 >nul 2>&1
if errorlevel 1 (
    echo [WARNING] MongoDB not running on port 27017
    echo.
    echo Attempting to start MongoDB service...
    
    net start MongoDB 2>&1 | findstr /i "success already" >nul
    if errorlevel 1 (
        echo.
        echo [ERROR] Could not start MongoDB automatically
        echo.
        echo SOLUTIONS:
        echo   1. Start MongoDB manually (Windows Services - search "services.msc")
        echo   2. Or install MongoDB from: https://www.mongodb.com/try/download/community
        echo.
        echo Press any key to continue anyway and try...
        echo.
        pause
    ) else (
        echo [OK] MongoDB service started successfully
        timeout /t 2 >nul
    )
) else (
    echo [OK] MongoDB is already running on port 27017
)
echo.

REM ====== Backend Setup ======
echo ======================================================
echo   Setting up Backend...
echo ======================================================
echo.

cd /d "%~dp0backend" 2>nul
if errorlevel 1 (
    cd /d "%~dp0"
    echo [ERROR] Backend folder not found!
    echo Current directory: %cd%
    pause
    exit /b 1
)

echo [OK] Backend folder found at: %cd%
echo.

REM Check if node_modules exists
if exist "node_modules" (
    echo [OK] Backend dependencies already installed
) else (
    echo [INFO] Installing backend dependencies...
    echo This may take 1-2 minutes on first run...
    call npm install
    if errorlevel 1 (
        echo [ERROR] npm install failed
        echo.
        pause
        exit /b 1
    )
    echo [OK] Dependencies installed
)
echo.

REM ====== Frontend Server Check ======
echo ======================================================
echo   Checking Frontend Server...
echo ======================================================
echo.

where http-server >nul 2>&1
if errorlevel 1 (
    echo [INFO] Installing http-server globally...
    call npm install -g http-server
    if errorlevel 1 (
        echo [WARNING] Could not install http-server globally
        echo Will try to install locally...
        call npm install http-server
    )
    echo [OK] http-server installed
) else (
    echo [OK] http-server available
)
echo.

REM ====== Starting Services ======
echo ======================================================
echo   Starting All Services...
echo ======================================================
echo.

cd /d "%~dp0"

echo [1/2] Starting Backend Server on port 3000...
start "Event-Management-Backend" cmd /k "cd /d backend && npm run dev"
timeout /t 4 >nul

echo [2/2] Starting Frontend Server on port 8080...
start "Event-Management-Frontend" cmd /k "cd /d . && http-server -p 8080 -c-1 --cors"
timeout /t 3 >nul

echo.
echo ======================================================
echo   ✓ All Services Started!
echo ======================================================
echo.
echo ACCESS YOUR APPLICATION:
echo   - Frontend (Home):    http://localhost:8080/home.html
echo   - Login Page:         http://localhost:8080/login.html
echo   - Register Page:      http://localhost:8080/register.html
echo   - Backend API:        http://localhost:3000
echo   - Database:           MongoDB (port 27017)
echo.
echo WINDOWS OPENED:
echo   1. Backend Server Terminal - Do NOT close
echo   2. Frontend Server Terminal - Do NOT close
echo.
echo.
timeout /t 2 >nul
echo Opening application in browser...
start "" "http://localhost:8080/home.html"

echo.
echo ======================================================
echo   Setup Complete - Ready to Use!
echo ======================================================
echo.
echo IMPORTANT:
echo - Keep both server terminals open
echo - Keep this window open
echo - Do NOT close any windows
echo.
echo TO STOP ALL SERVICES:
echo - Close Backend Terminal (Ctrl+C then Y)
echo - Close Frontend Terminal (Ctrl+C then Y)
echo - Close this window
echo.
echo For debugging, check: %LOGFILE%
echo.
echo ======================================================
echo.

REM Keep this window open
pause


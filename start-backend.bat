@echo off
REM Event Management System - Easy Start Script

echo.
echo ===============================================
echo   Event Management System Backend Startup
echo ===============================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo ✓ Node.js found
node --version
echo.

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm is not installed
    pause
    exit /b 1
)

echo ✓ npm found
npm --version
echo.

REM Navigate to backend
cd backend
if errorlevel 1 (
    echo ERROR: Could not find backend folder
    pause
    exit /b 1
)

echo ✓ Backend folder found
echo.

REM Check if node_modules exists
if exist "node_modules" (
    echo ✓ Dependencies already installed
) else (
    echo ! Installing dependencies (first time only)
    echo.
    call npm install
    if errorlevel 1 (
        echo ERROR: npm install failed
        pause
        exit /b 1
    )
)

echo.
echo ===============================================
echo   Starting Development Server...
echo ===============================================
echo.
echo Server will run on: http://localhost:3000
echo Dashboard: http://localhost:3000/api/health
echo.
echo Press Ctrl+C to stop
echo.

REM Start the server in development mode
npm run dev
if errorlevel 1 (
    echo.
    echo ERROR: Server failed to start
    echo Make sure MongoDB is running!
    echo.
)

pause

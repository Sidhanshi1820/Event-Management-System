#!/bin/bash

# Event Management System - Easy Start Script (Mac/Linux)

echo ""
echo "==============================================="
echo "  Event Management System Backend Startup"
echo "==============================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed"
    echo "Please install from https://nodejs.org/"
    exit 1
fi

echo "✓ Node.js found"
node --version
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "ERROR: npm is not installed"
    exit 1
fi

echo "✓ npm found"
npm --version
echo ""

# Navigate to backend
cd backend || exit 1
echo "✓ Backend folder found"
echo ""

# Check if node_modules exists
if [ -d "node_modules" ]; then
    echo "✓ Dependencies already installed"
else
    echo "! Installing dependencies (first time only)"
    echo ""
    npm install
    if [ $? -ne 0 ]; then
        echo "ERROR: npm install failed"
        exit 1
    fi
fi

echo ""
echo "==============================================="
echo "  Starting Development Server..."
echo "==============================================="
echo ""
echo "Server will run on: http://localhost:3000"
echo "Dashboard: http://localhost:3000/api/health"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Start the server
npm run dev

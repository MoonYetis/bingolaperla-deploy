#!/bin/bash

# Quick Start Script for Bingo La Perla Development
# Usage: ./scripts/quick-start.sh

set -e

BACKEND_DIR="/Users/osmanmarin/Documents/Bingo-deploy/backend"
FRONTEND_DIR="/Users/osmanmarin/Documents/Bingo-deploy/frontend"

echo "🚀 Starting Bingo La Perla Development Environment..."

# Function to kill existing processes
cleanup() {
    echo "🧹 Cleaning up existing processes..."
    pkill -f "nodemon.*server.ts" || true
    pkill -f "ts-node.*server.ts" || true
    pkill -f "vite" || true
    lsof -ti:3001 | xargs kill -9 2>/dev/null || true
    lsof -ti:5173 | xargs kill -9 2>/dev/null || true
    sleep 3
}

# Cleanup first
cleanup

# Start Backend
echo "🔧 Starting Backend Server..."
cd "$BACKEND_DIR"
npm run dev &
BACKEND_PID=$!

# Wait for backend to start
echo "⏳ Waiting for backend to initialize..."
sleep 10

# Start Frontend
echo "⚛️ Starting Frontend Server..."
cd "$FRONTEND_DIR"
npm run dev &
FRONTEND_PID=$!

echo "✅ Both servers started!"
echo "📱 Frontend: http://localhost:5173"
echo "🔌 Backend: http://localhost:3001"
echo ""
echo "📋 Test credentials:"
echo "   Email: jugador@test.com"
echo "   Password: password123"
echo "   Balance: 99 Perlas"
echo ""
echo "Press Ctrl+C to stop all servers..."

# Wait for user interrupt
trap "echo; echo '🛑 Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; cleanup; exit 0" INT

# Keep script running
wait
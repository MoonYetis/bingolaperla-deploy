#!/bin/bash

# Health Monitor & Auto-Restart Script for Bingo La Perla
# Usage: ./scripts/health-monitor.sh

set -e

BACKEND_PORT=3001
FRONTEND_PORT=5173
BACKEND_DIR="/Users/osmanmarin/Documents/Bingo-deploy/backend"
FRONTEND_DIR="/Users/osmanmarin/Documents/Bingo-deploy/frontend"
LOG_FILE="/tmp/bingo-health.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

check_health() {
    local service=$1
    local port=$2
    local url=$3
    
    if curl -s --max-time 5 "http://localhost:$port$url" > /dev/null; then
        log "✅ $service is healthy (port $port)"
        return 0
    else
        log "❌ $service is down (port $port)"
        return 1
    fi
}

restart_backend() {
    log "🔄 Restarting backend server..."
    
    # Kill existing processes
    pkill -f "nodemon.*server.ts" || true
    pkill -f "ts-node.*server.ts" || true
    lsof -ti:$BACKEND_PORT | xargs kill -9 2>/dev/null || true
    
    sleep 3
    
    # Start backend
    cd "$BACKEND_DIR"
    nohup npm run dev > /tmp/backend.log 2>&1 &
    
    log "⏳ Waiting for backend to start..."
    sleep 10
    
    if check_health "Backend" "$BACKEND_PORT" "/api/health"; then
        log "✅ Backend restarted successfully"
    else
        log "❌ Backend restart failed"
    fi
}

restart_frontend() {
    log "🔄 Restarting frontend server..."
    
    # Kill existing processes
    pkill -f "vite" || true
    lsof -ti:$FRONTEND_PORT | xargs kill -9 2>/dev/null || true
    
    sleep 2
    
    # Start frontend
    cd "$FRONTEND_DIR"
    nohup npm run dev > /tmp/frontend.log 2>&1 &
    
    log "⏳ Waiting for frontend to start..."
    sleep 8
    
    if check_health "Frontend" "$FRONTEND_PORT" "/"; then
        log "✅ Frontend restarted successfully"
    else
        log "❌ Frontend restart failed"
    fi
}

main() {
    log "🔍 Starting health check..."
    
    # Check backend health
    if ! check_health "Backend" "$BACKEND_PORT" "/api/health"; then
        restart_backend
    fi
    
    # Check frontend health  
    if ! check_health "Frontend" "$FRONTEND_PORT" "/"; then
        restart_frontend
    fi
    
    log "✅ Health check completed"
}

# Run health check
main

# If --watch flag is provided, run continuously
if [[ "$1" == "--watch" ]]; then
    log "👁️  Starting continuous monitoring (every 60 seconds)..."
    while true; do
        sleep 60
        main
    done
fi
#!/bin/bash

echo "🚀 Iniciando Bingo La Perla - Backend Server"
echo "============================================="
echo "Puerto: 3001"
echo "URLs importantes:"
echo "  - Health Check: http://localhost:3001/health"
echo "  - API Base: http://localhost:3001/api"
echo "============================================="
echo ""

cd /Users/osmanmarin/Documents/Bingo-deploy/backend

# Verificar si ya existe un proceso
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Puerto 3001 ya está en uso. Terminando proceso existente..."
    pkill -f "nodemon.*server.ts" || true
    sleep 2
fi

echo "🔧 Iniciando servidor backend..."
npm run dev

echo "✅ Servidor backend iniciado correctamente"
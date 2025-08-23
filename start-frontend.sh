#!/bin/bash

echo "🎯 Iniciando Bingo La Perla - Frontend PWA"
echo "============================================="
echo "Puerto: 5173"
echo "URL Principal: http://localhost:5173"
echo "============================================="
echo ""

cd /Users/osmanmarin/Documents/Bingo-deploy/frontend

# Verificar si ya existe un proceso
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Puerto 5173 ya está en uso. Terminando proceso existente..."
    pkill -f "vite" || true
    sleep 2
fi

echo "🔧 Iniciando servidor frontend..."
npm run dev

echo "✅ Servidor frontend iniciado correctamente"
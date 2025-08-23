#!/bin/bash

echo "🎰 BINGO LA PERLA - Sistema Completo"
echo "====================================="
echo "Iniciando backend y frontend en paralelo..."
echo ""

# Función para manejar la interrupción
cleanup() {
    echo ""
    echo "🛑 Cerrando servidores..."
    pkill -f "nodemon.*server.ts" || true
    pkill -f "vite" || true
    exit 0
}

# Configurar trap para capturar Ctrl+C
trap cleanup SIGINT SIGTERM

cd /Users/osmanmarin/Documents/Bingo-deploy

# Verificar y terminar procesos existentes
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Terminando proceso en puerto 3001..."
    pkill -f "nodemon.*server.ts" || true
fi

if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Terminando proceso en puerto 5173..."
    pkill -f "vite" || true
fi

sleep 2

echo "🚀 Iniciando Backend (Puerto 3001)..."
cd /Users/osmanmarin/Documents/Bingo-deploy/backend && npm run dev &
BACKEND_PID=$!

echo "🎯 Iniciando Frontend (Puerto 5173)..."
cd /Users/osmanmarin/Documents/Bingo-deploy/frontend && npm run dev &
FRONTEND_PID=$!

# Esperar un poco para que los servidores se inicien
sleep 5

echo ""
echo "✅ ¡Sistema Bingo La Perla iniciado!"
echo "====================================="
echo "🌐 URLs de acceso:"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:3001"
echo "  Health:   http://localhost:3001/health"
echo ""
echo "👥 Credenciales de acceso:"
echo "  🔑 Admin:   admin / password123"
echo "  👤 Usuario: usuario / password123"
echo ""
echo "📱 Funcionalidades:"
echo "  • Streaming + Control Manual"
echo "  • Socket.IO Tiempo Real"
echo "  • PWA Instalable"
echo "  • Mobile-First Design"
echo ""
echo "🛑 Para cerrar: presiona Ctrl+C"
echo "====================================="

# Esperar hasta que se termine manualmente
wait
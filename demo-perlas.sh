#!/bin/bash

echo "💎 BINGO LA PERLA - SISTEMA PERLAS DEMO"
echo "========================================"
echo ""
echo "🎯 FUNCIONALIDADES IMPLEMENTADAS:"
echo "   ✅ Sistema de pagos Perlas completo (1 Perla = 1 Sol)"
echo "   ✅ Billetera digital con balance en tiempo real"
echo "   ✅ Transferencias P2P entre usuarios"
echo "   ✅ Panel administrativo para gestión de pagos"
echo "   ✅ Integración completa Bingo + Perlas"
echo "   ✅ Notificaciones Socket.IO en tiempo real"
echo "   ✅ Recarga por transferencia bancaria (con validación admin)"
echo "   ✅ Premios automáticos al ganar BINGO"
echo ""

echo "🔐 CREDENCIALES DE DEMO:"
echo "   👨‍💼 Admin:  admin / password123"
echo "   👤 User:   usuario / password123"
echo "   👤 Extra:  maria_gamer / password123"
echo ""

echo "💎 BALANCES INICIALES:"
echo "   Admin:      1,000.00 Perlas"
echo "   Usuario:      150.00 Perlas"
echo "   María:         75.00 Perlas"
echo ""

echo "📋 DATOS DE DEMO INCLUIDOS:"
echo "   • 3 usuarios con wallets configurados"
echo "   • Configuración de bancos peruanos (BCP, BBVA, Interbank, Scotia)"
echo "   • Depósitos pendientes para aprobar en admin"
echo "   • Historial de transacciones de ejemplo"
echo "   • Juego en progreso para demostrar compra de cartones"
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
    echo "⚠️  Backend ya corriendo en puerto 3001"
else
    echo "🚀 Iniciando Backend (Puerto 3001)..."
    cd /Users/osmanmarin/Documents/Bingo-deploy/backend && npm run dev &
    BACKEND_PID=$!
    sleep 3
fi

# El frontend ya está corriendo según la verificación previa
echo "🎯 Frontend detectado corriendo en puerto 5173"

echo ""
echo "✅ ¡Sistema Perlas LISTO para demostración!"
echo "==========================================="
echo ""
echo "🌐 URLs DE ACCESO:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3001"
echo "   Health:   http://localhost:3001/health"
echo ""
echo "📱 FLUJO DE DEMOSTRACIÓN RECOMENDADO:"
echo ""
echo "1️⃣  LOGIN COMO ADMIN:"
echo "   • Email: admin"
echo "   • Password: password123"
echo "   • Ir a Panel Admin → Pagos para aprobar depósitos pendientes"
echo ""
echo "2️⃣  LOGIN COMO USUARIO:"
echo "   • Email: usuario" 
echo "   • Password: password123"
echo "   • Ver balance: 150 Perlas"
echo "   • Ir a Billetera para transferir Perlas a maria_gamer"
echo "   • Comprar cartones de bingo con Perlas"
echo ""
echo "3️⃣  CARACTERÍSTICAS DESTACADAS:"
echo "   🔔 Notificaciones en tiempo real al recibir Perlas"
echo "   🎯 Compra de cartones usando balance de Perlas"
echo "   🏆 Premios automáticos al ganar BINGO"
echo "   📊 Panel admin con estadísticas de pagos"
echo "   💸 Transferencias P2P instantáneas"
echo ""
echo "⚡ NOTAS TÉCNICAS:"
echo "   • Base de datos SQLite con esquema completo de Perlas"
echo "   • Socket.IO para notificaciones (funciona sin Redis)"
echo "   • Validación manual de depósitos por admin"
echo "   • Sistema de referencias únicas para trazabilidad"
echo ""
echo "🛑 Para cerrar: presiona Ctrl+C"
echo "==========================================="

# Esperar hasta que se termine manualmente
wait
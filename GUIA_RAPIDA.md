# 🎰 Guía Rápida - Bingo La Perla

## 🚀 Cómo Iniciar el Sistema

### Opción 1: Sistema Completo (Recomendado)
```bash
./start-bingo.sh
```

### Opción 2: Servidores por Separado
```bash
# Terminal 1 - Backend
./start-backend.sh

# Terminal 2 - Frontend  
./start-frontend.sh
```

## 🌐 URLs de Acceso

- **🎮 Aplicación Principal**: http://localhost:5173
- **🔧 Backend API**: http://localhost:3001
- **💚 Health Check**: http://localhost:3001/health

## 👥 Credenciales de Acceso

### 🔑 **Administrador** (Control Total)
```
Username: admin
Password: password123
```
**Accesos exclusivos:**
- 👨‍💼 Panel de Administrador con grid B-I-N-G-O
- 📺 Configuración de streaming (YouTube/Twitch/RTMP)
- 🎯 Control manual de números
- ⚡ Socket.IO para envío en tiempo real

### 👤 **Usuario Regular**
```
Username: usuario
Password: password123
```
**Accesos:**
- 🎯 PLAY - Juego con streaming en vivo
- 👤 PERFIL - Balance y estadísticas
- ❓ AYUDA - Guías y FAQs
- 📺 Visualización de streaming
- 🎫 Cartones interactivos

## 🎮 Flujo de Uso

### **Como Administrador:**
1. Login en http://localhost:5173
2. Clic en botón **"👨‍💼 ADMIN"** (naranja - solo visible para admin)
3. Configurar URL del streaming en "Stream Control"
4. Usar grid B-I-N-G-O para cantar números
5. Los números se envían automáticamente a todos los jugadores

### **Como Jugador:**
1. Login en http://localhost:5173
2. Clic en **"🎯 PLAY"**
3. Comprar cartones
4. Ver streaming del presentador + números cantados
5. Los cartones se marcan automáticamente

## 🔥 Características Principales

- **📺 Streaming Integrado**: Iframe configurable para YouTube Live, Twitch, RTMP
- **⚡ Tiempo Real**: Socket.IO sincroniza admin → jugadores instantáneamente
- **🎯 Control Manual**: Grid de 75 números clickeable para el admin
- **🏆 Patrones Dinámicos**: Horizontal, vertical, diagonal, esquinas, cartón lleno
- **📱 PWA Móvil**: Instalable y completamente responsive
- **🔐 Seguridad**: Solo usuario "admin" específico ve controles de administración

## 🛑 Cómo Cerrar

- **Sistema completo**: `Ctrl+C` en el terminal donde corre `start-bingo.sh`
- **Servidores individuales**: `Ctrl+C` en cada terminal

## 🎯 Testing Rápido

1. **Backend activo**: Abrir http://localhost:3001/health
   - Debe mostrar: `{"status":"OK","service":"bingo-backend"}`

2. **Frontend activo**: Abrir http://localhost:5173
   - Debe cargar la página de login

3. **Login admin**: `admin` / `password123`
   - Debe mostrar botón ADMIN en el menú

4. **Socket.IO funcionando**: 
   - Admin canta número → Jugadores lo ven instantáneamente

## 🚨 Solución de Problemas

### Puerto ocupado:
```bash
# Verificar qué usa el puerto
lsof -i :3001  # Backend
lsof -i :5173  # Frontend

# Terminar procesos
pkill -f "nodemon"
pkill -f "vite"
```

### Base de datos:
```bash
cd backend/
npm run prisma:seed  # Recrear usuarios
```

### Dependencias:
```bash
# Backend
cd backend && npm install

# Frontend  
cd frontend && npm install
```

---

## 🎉 ¡Listo para Usar!

El sistema está **100% funcional** con:
- ✅ Streaming + Control manual implementado
- ✅ Usuarios preconfigurados
- ✅ Base de datos con datos de prueba
- ✅ Socket.IO tiempo real funcionando
- ✅ PWA instalable y responsive

**¡Disfruta de Bingo La Perla!** 🎰✨
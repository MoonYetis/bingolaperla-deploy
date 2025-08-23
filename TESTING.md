# 🧪 Guía de Testing - Módulo de Autenticación

## 📋 Checklist de Testing Completo

### ✅ Backend (Node.js + Express + PostgreSQL + Redis)

#### Configuración inicial:
- [ ] PostgreSQL corriendo en puerto 5432
- [ ] Redis corriendo en puerto 6379
- [ ] Variables de entorno configuradas (.env)
- [ ] Dependencias instaladas (`npm install`)
- [ ] Base de datos migrada (`npm run prisma:migrate`)
- [ ] Datos de prueba insertados (`npm run prisma:seed`)

#### Endpoints de Autenticación:
- [ ] POST `/api/auth/register` - Registro de usuarios
- [ ] POST `/api/auth/login` - Inicio de sesión
- [ ] POST `/api/auth/refresh` - Renovación de tokens
- [ ] POST `/api/auth/logout` - Cierre de sesión
- [ ] GET `/api/auth/me` - Perfil del usuario
- [ ] PUT `/api/auth/profile` - Actualización de perfil
- [ ] POST `/api/auth/change-password` - Cambio de contraseña

### ✅ Frontend (React + Vite + TypeScript)

#### Configuración inicial:
- [ ] Dependencias instaladas (`npm install`)
- [ ] Servidor de desarrollo corriendo (`npm run dev`)
- [ ] Proxy a backend configurado
- [ ] PWA funcionando correctamente

#### Flujos de Usuario:
- [ ] Registro de nuevo usuario
- [ ] Login con credenciales válidas
- [ ] Manejo de errores en formularios
- [ ] Persistencia de sesión
- [ ] Navegación con rutas protegidas
- [ ] Logout y limpieza de estado

## 🚀 Comandos de Testing

### Backend
```bash
cd backend

# Instalar dependencias
npm install

# Configurar base de datos
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

# Iniciar servidor de desarrollo
npm run dev

# Verificar health check
curl http://localhost:3001/health
```

### Frontend
```bash
cd frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Verificar compilación
npm run build
npm run type-check
```

## 🔧 Testing Manual - Casos de Uso

## 🔐 Credenciales de Prueba

El sistema incluye usuarios preconfigurados para testing:

### 👤 Administrador
- **Email**: admin@bingo-la-perla.com
- **Username**: admin
- **Password**: password123
- **Rol**: ADMIN

### 🎯 Usuario Regular  
- **Email**: jugador@test.com
- **Username**: jugador1
- **Password**: password123
- **Rol**: USER

> 📋 **Documentación Completa**: Ver [CREDENCIALES.md](./CREDENCIALES.md) para guía detallada

---

### 1. Registro de Usuario
**Endpoint**: `POST /api/auth/register`
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nuevo@ejemplo.com",
    "username": "nuevousuario",
    "password": "Test123456",
    "confirmPassword": "Test123456"
  }'
```

**Resultado esperado**: 
- Status 201
- Usuario creado
- Tokens JWT devueltos

### 2. Login con Usuario de Prueba
**Endpoint**: `POST /api/auth/login`

**Como Administrador:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "admin@bingo-la-perla.com",
    "password": "password123"
  }'
```

**Como Usuario Regular:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "jugador@test.com",
    "password": "password123"
  }'
```

**Resultado esperado**:
- Status 200
- Tokens JWT devueltos
- Información del usuario

### 3. Verificar Perfil
**Endpoint**: `GET /api/auth/me`
```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Resultado esperado**:
- Status 200
- Información del usuario autenticado

### 4. Logout
**Endpoint**: `POST /api/auth/logout`
```bash
curl -X POST http://localhost:3001/api/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Resultado esperado**:
- Status 200
- Sesión invalidada

## 🖥️ Testing Frontend

### Flujo Completo de Autenticación:

1. **Abrir** http://localhost:3000
2. **Navegar** a "Registrarse"
3. **Completar** formulario de registro
4. **Verificar** redirección al dashboard
5. **Cerrar sesión**
6. **Intentar** acceder al dashboard (debe redirigir a login)
7. **Hacer login** con las credenciales creadas
8. **Verificar** que funcione la navegación

### Casos de Error:

1. **Registro con email duplicado**
2. **Login con credenciales incorrectas**
3. **Acceso a rutas protegidas sin autenticación**
4. **Contraseñas que no coinciden en registro**
5. **Campos requeridos vacíos**

## 📊 Resultados Esperados

### ✅ Funcionalidades que DEBEN funcionar:

1. **Registro**: Usuario puede crear cuenta nueva
2. **Login**: Usuario puede iniciar sesión
3. **Persistencia**: Sesión persiste al recargar página
4. **Protección**: Rutas protegidas redirigen a login
5. **Logout**: Usuario puede cerrar sesión correctamente
6. **Validación**: Formularios validan datos correctamente
7. **Errores**: Mensajes de error claros y útiles
8. **PWA**: App se puede instalar como PWA
9. **Responsive**: Funciona en móvil y desktop
10. **Performance**: Carga rápida y sin delays excesivos

### 🔍 Indicadores de Éxito:

- ✅ Backend responde en < 200ms
- ✅ Frontend carga en < 3 segundos
- ✅ No hay errores en consola del navegador
- ✅ No hay errores en logs del servidor
- ✅ Tokens JWT son válidos y seguros
- ✅ Sesiones se invalidan correctamente
- ✅ PWA se instala sin problemas
- ✅ Funciona offline (assets básicos)

## 🐛 Solución de Problemas Comunes

### Backend no inicia:
- Verificar PostgreSQL está corriendo
- Verificar Redis está corriendo
- Revisar variables de entorno
- Verificar puertos disponibles

### Frontend no conecta:
- Verificar proxy configuration en vite.config.ts
- Verificar backend está corriendo en puerto 3001
- Revisar CORS configuration

### Errores de autenticación:
- Verificar JWT secrets están configurados
- Revisar tokens en localStorage
- Verificar headers de Authorization

### PWA no funciona:
- Verificar HTTPS (requerido para PWA)
- Revisar service worker registration
- Verificar manifest.json es válido

---

## 🎯 Testing del Bingo Tradicional

### Flujo Completo de Juego Manual

#### **1. Preparación (Como Administrador)**
```bash
# Login como admin
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin@bingo-la-perla.com","password":"password123"}'

# Crear nueva partida
curl -X POST http://localhost:3001/api/games \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Bingo Test Manual",
    "description": "Partida de prueba",
    "maxPlayers": 20,
    "cardPrice": 5.00,
    "scheduledAt": "2024-01-01T20:00:00Z"
  }'

# Iniciar partida
curl -X POST http://localhost:3001/api/games/GAME_ID/start \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

#### **2. Participación (Como Usuario)**
```bash
# Login como jugador
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"jugador@test.com","password":"password123"}'

# Unirse a partida
curl -X POST http://localhost:3001/api/games/GAME_ID/join \
  -H "Authorization: Bearer YOUR_USER_TOKEN"

# Generar cartones
curl -X POST http://localhost:3001/api/bingo-cards/generate \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"gameId":"GAME_ID","count":3}'
```

#### **3. Juego Tradicional**
```bash
# Admin sortea bola
curl -X POST http://localhost:3001/api/games/GAME_ID/draw-ball \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Usuario marca número manualmente
curl -X POST http://localhost:3001/api/bingo-cards/mark \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"cardId":"CARD_ID","number":23}'

# Usuario anuncia BINGO
curl -X POST http://localhost:3001/api/games/GAME_ID/announce-bingo \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"cardId":"CARD_ID"}'
```

### ✅ Checklist de Testing Manual

#### **Frontend (http://localhost:3000)**
- [ ] Login con credenciales de admin y usuario
- [ ] Creación de partida (solo admin)
- [ ] Unirse a partida (usuario)
- [ ] Generación de cartones (máximo 3)
- [ ] Marcado manual haciendo click en números
- [ ] Botón "¡BINGO!" visible en cada cartón
- [ ] Anuncio de BINGO con validación
- [ ] Feedback visual para BINGO válido/inválido
- [ ] Resaltado de última bola cantada
- [ ] Indicador "Marcado Manual" en interfaz

#### **Backend API**
- [ ] Endpoint `POST /api/games/:id/announce-bingo` funciona
- [ ] Validación de patrones al anunciar BINGO
- [ ] Marcado manual sin restricciones (cualquier número)
- [ ] No hay auto-marcado cuando se sortean bolas
- [ ] Logs de anuncios de BINGO (válidos e inválidos)

### 🎮 Casos de Uso Específicos

#### **Caso 1: BINGO Válido**
1. Usuario marca números que forman un patrón válido
2. Presiona "¡BINGO!"
3. Sistema valida y confirma BINGO
4. Cartón se marca como ganador

#### **Caso 2: BINGO Inválido**
1. Usuario marca números que NO forman patrón
2. Presiona "¡BINGO!"
3. Sistema rechaza y muestra mensaje de error
4. Juego continúa normalmente

#### **Caso 3: Marcado Libre**
1. Usuario puede marcar cualquier número del cartón
2. No hay restricción de números cantados
3. Validación ocurre solo al anunciar BINGO

### 🚨 Problemas Comunes del Bingo

#### Botón BINGO no aparece:
- Verificar prop `showBingoButton` en componentes
- Revisar que `gameId` esté presente

#### No se puede marcar números:
- Verificar que el juego esté "IN_PROGRESS"
- Confirmar que el número no esté ya marcado

#### BINGO siempre inválido:
- Verificar algoritmo de detección de patrones
- Revistar que los números marcados estén actualizados

### 📊 Métricas de Éxito

- ✅ **Experiencia Auténtica**: Se siente como bingo real
- ✅ **Control del Jugador**: Total control sobre marcado
- ✅ **Validación Justa**: Patrones verificados correctamente
- ✅ **Feedback Claro**: Respuestas inmediatas y claras
- ✅ **Sin Bugs**: Funcionalidad robusta sin errores
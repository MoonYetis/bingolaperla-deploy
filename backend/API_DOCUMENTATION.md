# API Documentation - Bingo La Perla Backend

## 📋 Información General

- **URL Base**: `http://localhost:3001/api`
- **Autenticación**: JWT Bearer Tokens
- **Formato**: JSON
- **Versionado**: v1 (implícito)

## 🔐 Autenticación

El sistema utiliza JWT con Access Tokens (corta duración) y Refresh Tokens (larga duración).

### Headers Requeridos
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

---

## 📡 Endpoints de Autenticación

### POST `/auth/register`
Registrar un nuevo usuario

**Rate Limit**: 5 intentos por 15 minutos

**Body**:
```json
{
  "email": "usuario@ejemplo.com",
  "username": "miusuario",
  "password": "MiPassword123!",
  "confirmPassword": "MiPassword123!"
}
```

**Validaciones**:
- `email`: Formato válido, máximo 255 caracteres
- `username`: 3-30 caracteres, solo letras, números y guiones bajos
- `password`: Mínimo 8 caracteres, debe contener mayúscula, minúscula y número
- `confirmPassword`: Debe coincidir con password

**Respuesta Exitosa** (201):
```json
{
  "message": "Usuario registrado exitosamente",
  "user": {
    "id": "uuid-user-id",
    "email": "usuario@ejemplo.com",
    "username": "miusuario",
    "isActive": true,
    "role": "USER",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900
  }
}
```

---

### POST `/auth/login`
Iniciar sesión

**Rate Limit**: 10 intentos por 15 minutos

**Body**:
```json
{
  "identifier": "usuario@ejemplo.com",  // Email o username
  "password": "MiPassword123!"
}
```

**Respuesta Exitosa** (200):
```json
{
  "message": "Login exitoso",
  "user": {
    "id": "uuid-user-id",
    "email": "usuario@ejemplo.com",
    "username": "miusuario",
    "isActive": true,
    "role": "USER"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900
  }
}
```

---

### POST `/auth/refresh`
Renovar access token

**Rate Limit**: 10 intentos por 15 minutos

**Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Respuesta Exitosa** (200):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900
}
```

---

### POST `/auth/logout`
Cerrar sesión (invalidar tokens)

**Autenticación**: Requerida

**Respuesta Exitosa** (200):
```json
{
  "message": "Logout exitoso"
}
```

---

### POST `/auth/logout-all`
Cerrar sesión en todos los dispositivos

**Autenticación**: Requerida (Full)

**Respuesta Exitosa** (200):
```json
{
  "message": "Logout exitoso en todos los dispositivos"
}
```

---

### GET `/auth/me`
Obtener perfil del usuario autenticado

**Autenticación**: Requerida (Full)

**Respuesta Exitosa** (200):
```json
{
  "user": {
    "id": "uuid-user-id",
    "email": "usuario@ejemplo.com",
    "username": "miusuario",
    "isActive": true,
    "role": "USER",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### PUT `/auth/profile`
Actualizar perfil del usuario

**Autenticación**: Requerida (Full)

**Body**:
```json
{
  "email": "nuevo@ejemplo.com",    // Opcional
  "username": "nuevousuario"       // Opcional
}
```

**Respuesta Exitosa** (200):
```json
{
  "message": "Perfil actualizado exitosamente",
  "user": {
    "id": "uuid-user-id",
    "email": "nuevo@ejemplo.com",
    "username": "nuevousuario",
    "isActive": true,
    "role": "USER",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### POST `/auth/change-password`
Cambiar contraseña del usuario

**Autenticación**: Requerida (Full)

**Body**:
```json
{
  "currentPassword": "MiPasswordActual123!",
  "newPassword": "MiNuevoPassword123!",
  "confirmNewPassword": "MiNuevoPassword123!"
}
```

**Respuesta Exitosa** (200):
```json
{
  "message": "Contraseña cambiada exitosamente"
}
```

---

## 🎮 Endpoints de Juegos

### GET `/games/dashboard/stats`
Obtener estadísticas del dashboard

**Autenticación**: No requerida

**Respuesta Exitosa** (200):
```json
{
  "stats": {
    "totalGames": 25,
    "activeGames": 3,
    "totalPlayers": 150,
    "onlinePlayers": 45
  }
}
```

---

### GET `/games`
Obtener todos los juegos disponibles

**Query Parameters**:
- `status` (opcional): `WAITING`, `ACTIVE`, `FINISHED`
- `limit` (opcional): Número máximo de resultados (default: 10)
- `offset` (opcional): Offset para paginación (default: 0)

**Respuesta Exitosa** (200):
```json
{
  "games": [
    {
      "id": "game-uuid",
      "name": "Bingo Nocturno",
      "description": "Bingo de la noche con premios especiales",
      "status": "WAITING",
      "maxPlayers": 100,
      "currentPlayers": 25,
      "prize": 500.00,
      "startTime": "2024-01-01T20:00:00.000Z",
      "createdAt": "2024-01-01T18:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

---

### GET `/games/:gameId`
Obtener detalles de un juego específico

**Parámetros**:
- `gameId`: UUID del juego

**Respuesta Exitosa** (200):
```json
{
  "game": {
    "id": "game-uuid",
    "name": "Bingo Nocturno",
    "description": "Bingo de la noche con premios especiales",
    "status": "ACTIVE",
    "maxPlayers": 100,
    "currentPlayers": 45,
    "prize": 500.00,
    "ballsDrawn": [5, 23, 41, 62, 18],
    "lastBall": 62,
    "startTime": "2024-01-01T20:00:00.000Z",
    "createdAt": "2024-01-01T18:00:00.000Z",
    "players": [
      {
        "id": "user-uuid",
        "username": "jugador1",
        "cardsCount": 3
      }
    ]
  }
}
```

---

### POST `/games`
Crear un nuevo juego (Solo administradores)

**Autenticación**: Requerida + Admin

**Body**:
```json
{
  "name": "Nuevo Bingo",
  "description": "Descripción del bingo",
  "maxPlayers": 100,
  "prize": 1000.00,
  "startTime": "2024-01-01T20:00:00.000Z"
}
```

**Respuesta Exitosa** (201):
```json
{
  "message": "Juego creado exitosamente",
  "game": {
    "id": "new-game-uuid",
    "name": "Nuevo Bingo",
    "status": "WAITING",
    "createdAt": "2024-01-01T18:00:00.000Z"
  }
}
```

---

### POST `/games/:gameId/join`
Unirse a un juego

**Autenticación**: Requerida

**Body**:
```json
{
  "cardsCount": 3  // Número de cartones a generar (1-4)
}
```

**Respuesta Exitosa** (200):
```json
{
  "message": "Te has unido al juego exitosamente",
  "game": {
    "id": "game-uuid",
    "name": "Bingo Nocturno",
    "status": "WAITING"
  },
  "cards": [
    {
      "id": "card-uuid-1",
      "numbers": [
        [1, 16, 31, 46, 61],
        [2, 17, null, 47, 62],
        [3, 18, 33, 48, 63],
        [4, 19, 34, 49, 64],
        [5, 20, 35, 50, 65]
      ],
      "markedNumbers": []
    }
  ]
}
```

---

### POST `/games/:gameId/start-demo`
Iniciar demo con sorteo automático

**Autenticación**: No requerida (para testing)

**Respuesta Exitosa** (200):
```json
{
  "message": "Demo iniciado - sorteo automático cada 4 segundos",
  "gameId": "game-uuid"
}
```

---

### POST `/games/:gameId/stop-demo`
Detener demo automático

**Autenticación**: No requerida (para testing)

**Respuesta Exitosa** (200):
```json
{
  "message": "Demo detenido",
  "gameId": "game-uuid"
}
```

---

## 🎯 Endpoints de Cartones

### POST `/cards/generate`
Generar cartones para un juego

**Autenticación**: Requerida

**Body**:
```json
{
  "gameId": "game-uuid",
  "count": 3  // Número de cartones (1-4)
}
```

**Respuesta Exitosa** (201):
```json
{
  "message": "Cartones generados exitosamente",
  "cards": [
    {
      "id": "card-uuid-1",
      "gameId": "game-uuid",
      "userId": "user-uuid",
      "numbers": [
        [1, 16, 31, 46, 61],
        [2, 17, null, 47, 62],
        [3, 18, 33, 48, 63],
        [4, 19, 34, 49, 64],
        [5, 20, 35, 50, 65]
      ],
      "markedNumbers": [],
      "isActive": true,
      "createdAt": "2024-01-01T19:00:00.000Z"
    }
  ],
  "count": 3
}
```

---

### GET `/cards/my/:gameId`
Obtener mis cartones para un juego

**Autenticación**: Requerida

**Parámetros**:
- `gameId`: UUID del juego

**Respuesta Exitosa** (200):
```json
{
  "cards": [
    {
      "id": "card-uuid-1",
      "numbers": [
        [1, 16, 31, 46, 61],
        [2, 17, null, 47, 62],
        [3, 18, 33, 48, 63],
        [4, 19, 34, 49, 64],
        [5, 20, 35, 50, 65]
      ],
      "markedNumbers": [1, 16, 31],
      "patterns": {
        "hasLine": false,
        "hasBingo": false,
        "lineType": null
      },
      "isActive": true
    }
  ],
  "count": 3
}
```

---

### PUT `/cards/:cardId/mark`
Marcar número en cartón

**Autenticación**: Requerida

**Parámetros**:
- `cardId`: UUID del cartón

**Body**:
```json
{
  "number": 16
}
```

**Respuesta Exitosa** (200):
```json
{
  "message": "Número marcado exitosamente",
  "card": {
    "id": "card-uuid-1",
    "markedNumbers": [1, 16, 31],
    "patterns": {
      "hasLine": false,
      "hasBingo": false,
      "lineType": null
    }
  },
  "wasAlreadyMarked": false
}
```

---

### GET `/cards/:cardId/patterns`
Obtener patrones del cartón (líneas, bingo)

**Autenticación**: Requerida

**Respuesta Exitosa** (200):
```json
{
  "patterns": {
    "hasLine": true,
    "hasBingo": false,
    "lineType": "HORIZONTAL_1",
    "completedPatterns": [
      {
        "type": "LINE_HORIZONTAL",
        "row": 0,
        "numbers": [1, 16, 31, 46, 61]
      }
    ]
  }
}
```

---

### POST `/cards/validate`
Validar estructura de cartón

**Autenticación**: No requerida

**Body**:
```json
{
  "numbers": [
    [1, 16, 31, 46, 61],
    [2, 17, null, 47, 62],
    [3, 18, 33, 48, 63],
    [4, 19, 34, 49, 64],
    [5, 20, 35, 50, 65]
  ]
}
```

**Respuesta Exitosa** (200):
```json
{
  "isValid": true,
  "errors": [],
  "summary": {
    "totalNumbers": 24,
    "freeSpaces": 1,
    "duplicates": 0,
    "outOfRange": 0
  }
}
```

---

## 🚨 Códigos de Error

### Errores de Autenticación
- `400` - Datos de entrada inválidos
- `401` - Token inválido o expirado
- `403` - Permisos insuficientes
- `404` - Usuario no encontrado
- `409` - Email o username ya existe
- `422` - Validación de datos fallida
- `429` - Rate limit excedido

### Errores de Juego
- `404` - Juego no encontrado
- `400` - Juego lleno o no disponible
- `409` - Ya estás en el juego
- `422` - Estado de juego inválido

### Errores de Cartones
- `404` - Cartón no encontrado
- `403` - No tienes acceso a este cartón
- `400` - Número ya marcado o inválido
- `409` - Límite de cartones excedido

---

## 🔄 Eventos Socket.IO

El servidor también emite eventos en tiempo real via Socket.IO:

### Eventos del Cliente → Servidor
- `join-game-room` - Unirse a sala de juego
- `leave-game-room` - Abandonar sala
- `mark-number` - Marcar número
- `bingo-claimed` - Reclamar BINGO

### Eventos del Servidor → Cliente
- `joined-game-room` - Confirmación de unión
- `player-joined` - Nuevo jugador se unió
- `player-left` - Jugador abandonó
- `new-ball-drawn` - Nueva bola sorteada
- `number-marked` - Número marcado confirmado
- `bingo-winner` - Ganador de BINGO
- `game-status-updated` - Estado del juego actualizado

---

## 🛠️ Testing

### Endpoint de Health Check
```bash
GET /health
```

**Respuesta**:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "services": {
    "database": "connected",
    "redis": "connected"
  }
}
```

### Endpoint de Testing de Cartones
```bash
GET /api/games/test-cards/:gameId
```

Genera cartones de prueba sin autenticación para testing rápido.

---

## 📊 Rate Limiting

### Límites por Endpoint
- **Registro**: 5 intentos por 15 minutos por IP
- **Login**: 10 intentos por 15 minutos por IP
- **Refresh Token**: 10 intentos por 15 minutos por IP
- **Otros endpoints**: 100 requests por 15 minutos por IP

### Headers de Rate Limit
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 8
X-RateLimit-Reset: 1640995200
```
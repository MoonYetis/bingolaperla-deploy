# 🏗️ Arquitectura Completa - Bingo La Perla

## 📋 Índice
- [Resumen Ejecutivo](#resumen-ejecutivo)
- [Arquitectura del Sistema](#arquitectura-del-sistema)
- [Backend - Node.js/TypeScript](#backend---nodejstypescript)
- [Frontend - React/TypeScript PWA](#frontend---reacttypescript-pwa)
- [Base de Datos - SQLite/Prisma](#base-de-datos---sqliteprisma)
- [Sistema de Pagos "Perlas"](#sistema-de-pagos-perlas)
- [Integración Openpay](#integración-openpay)
- [Tiempo Real - WebSockets](#tiempo-real---websockets)
- [APIs y Endpoints](#apis-y-endpoints)
- [Seguridad y Autenticación](#seguridad-y-autenticación)
- [Monitoreo y Analytics](#monitoreo-y-analytics)
- [Deployment y DevOps](#deployment-y-devops)

---

## 🎯 Resumen Ejecutivo

**Bingo La Perla** es una plataforma completa de bingo online de 75 bolas con sistema de pagos integrado, desarrollada como PWA (Progressive Web App) para máxima compatibilidad mobile-first.

### Características Principales
- 🎲 **Bingo de 75 bolas** en tiempo real
- 💎 **Sistema de moneda virtual "Perlas"** (1 Perla = 1 Sol)
- 💳 **Integración Openpay** para pagos con tarjetas
- 🏦 **Pagos tradicionales** (bancos peruanos, Yape, Plin)
- 📱 **PWA mobile-first** con soporte offline
- ⚡ **Tiempo real** con WebSockets
- 👨‍💼 **Panel administrativo** completo
- 📊 **Analytics y reportes** integrados
- 🔐 **Seguridad bancaria** y auditoría

### Stack Tecnológico
- **Backend**: Node.js + TypeScript + Express + Prisma
- **Frontend**: React + TypeScript + Redux Toolkit + Tailwind CSS
- **Base de Datos**: SQLite (desarrollo) / PostgreSQL (producción)
- **Cache**: Redis
- **Tiempo Real**: Socket.IO
- **Pagos**: Openpay API + métodos tradicionales peruanos
- **Testing**: Jest + Playwright
- **DevOps**: Docker + GitHub Actions

---

## 🏗️ Arquitectura del Sistema

### Diagrama de Alto Nivel
```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (PWA)                           │
│  React + TypeScript + Redux + Socket.IO-Client             │
├─────────────────────────────────────────────────────────────┤
│                    TIEMPO REAL                              │
│              WebSockets (Socket.IO)                         │
├─────────────────────────────────────────────────────────────┤
│                   BACKEND API                               │
│   Node.js + Express + TypeScript + Middleware              │
├─────────────────────────────────────────────────────────────┤
│               CAPA DE SERVICIOS                             │
│  Game Service | Payment Service | Openpay Service          │
├─────────────────────────────────────────────────────────────┤
│                BASE DE DATOS                                │
│          SQLite (dev) / PostgreSQL (prod)                  │
│                 Prisma ORM                                  │
├─────────────────────────────────────────────────────────────┤
│               SERVICIOS EXTERNOS                            │
│    Openpay API | Redis Cache | SMTP | Monitoring           │
└─────────────────────────────────────────────────────────────┘
```

### Principios Arquitectónicos
- **Modular**: Separación clara de responsabilidades
- **Escalable**: Arquitectura preparada para crecimiento
- **Seguro**: Validaciones en múltiples capas
- **Auditado**: Logs completos para compliance
- **Mobile-First**: Diseño responsivo prioritario
- **Tiempo Real**: Experiencia inmersiva con WebSockets

---

## 🖥️ Backend - Node.js/TypeScript

### Estructura del Proyecto
```
src/
├── config/           # Configuraciones del sistema
│   ├── database.ts   # Conexión base de datos
│   ├── redis.ts      # Conexión cache Redis
│   ├── environment.ts # Variables de entorno
│   ├── openpay.ts    # Configuración Openpay
│   └── development.ts # Perfiles de desarrollo
├── controllers/      # Controladores API
│   ├── authController.ts
│   ├── gameController.ts
│   ├── paymentController.ts
│   ├── openpayController.ts
│   ├── walletController.ts
│   └── admin/        # Controladores administrativos
├── services/         # Lógica de negocio
│   ├── gameService.ts
│   ├── paymentService.ts
│   ├── openpayService.ts
│   ├── walletService.ts
│   ├── analyticsService.ts
│   └── notificationService.ts
├── middleware/       # Middleware personalizado
│   ├── auth.ts       # Autenticación JWT
│   ├── validation.ts # Validación de datos
│   ├── rateLimiting.ts # Control de tasa
│   └── openpaySecurityMiddleware.ts
├── routes/          # Definición de rutas
│   ├── auth.ts
│   ├── game.ts
│   ├── payment.ts
│   ├── openpay.ts
│   ├── wallet.ts
│   └── admin/       # Rutas administrativas
├── types/           # Definiciones TypeScript
├── utils/           # Utilidades compartidas
└── __tests__/       # Tests unitarios e integración
```

### Características Técnicas del Backend

#### 🔐 Autenticación y Autorización
- **JWT Tokens** con refresh tokens
- **Roles de usuario**: USER, ADMIN
- **Middleware de autenticación** para rutas protegidas
- **Rate limiting** por usuario e IP
- **Validación de datos** con Zod schemas

#### 📊 API RESTful
- **Arquitectura REST** bien estructurada
- **Versionado de API** preparado
- **Documentación** con comentarios JSDoc
- **Validación de entrada** en múltiples capas
- **Manejo de errores** centralizado

#### ⚡ Tiempo Real con WebSockets
```typescript
// Eventos de Socket.IO implementados:
- join-game-room       # Unirse a sala de juego
- ball-drawn          # Nueva bola cantada
- mark-number         # Marcar número en cartón
- bingo-claimed       # Reclamar BINGO
- admin-call-number   # Admin canta número
- game-status-changed # Cambio estado del juego
```

#### 🛡️ Seguridad
- **Helmet.js** para headers de seguridad
- **CORS** configurado para frontend
- **Validación de entrada** con Zod
- **Sanitización de datos**
- **Logs de auditoría** completos
- **Rate limiting** inteligente

---

## 📱 Frontend - React/TypeScript PWA

### Arquitectura Frontend
```
src/
├── components/       # Componentes reutilizables
│   ├── auth/        # Login, registro
│   ├── bingo/       # Cartones, juego
│   ├── common/      # Componentes base
│   ├── payment/     # Pagos y Openpay
│   ├── wallet/      # Billetera y transacciones
│   ├── admin/       # Panel administrativo
│   └── analytics/   # Gráficos y métricas
├── pages/           # Páginas principales
│   ├── LoginPage.tsx
│   ├── MainMenuPage.tsx
│   ├── GamePage.tsx
│   ├── WalletPage.tsx
│   ├── AdminPage.tsx
│   └── PaymentAdminPage.tsx
├── hooks/           # Custom hooks
│   ├── useAuth.ts
│   ├── useSocket.ts
│   ├── useBingoSocket.ts
│   ├── useRetryQueue.ts
│   └── useNetworkStatus.ts
├── services/        # Servicios API
│   ├── api.ts       # Cliente HTTP base
│   ├── authApi.ts
│   ├── gameApi.ts
│   ├── paymentApi.ts
│   ├── openpayApi.ts
│   └── walletApi.ts
├── store/           # Estado global Redux
│   ├── authSlice.ts
│   ├── gameSlice.ts
│   ├── gamePlaySlice.ts
│   └── bingoCardSlice.ts
├── types/           # Tipos TypeScript
└── utils/           # Utilidades
```

### Características PWA
- 📲 **Instalable** en dispositivos móviles
- 🔄 **Service Worker** para cache offline
- 📊 **Manifest** con iconos y configuración
- 🔔 **Push notifications** (preparado)
- 📱 **Mobile-first responsive design**
- ⚡ **Lazy loading** de componentes

### Estado Global con Redux Toolkit
- **Slices separados** por dominio
- **RTK Query** para cache de API
- **Middleware personalizado** para WebSockets
- **Persistencia** en localStorage
- **DevTools** para debugging

---

## 🗄️ Base de Datos - SQLite/Prisma

### Modelo de Datos Completo

#### Usuarios y Autenticación
```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  username      String   @unique
  password      String   # Hash bcrypt
  role          String   @default("USER")
  balance       Decimal  @default(0.00)     # Legacy
  pearlsBalance Decimal  @default(0.00)     # Perlas actuales
  fullName      String?
  phone         String?
  dni           String?  @unique
  isActive      Boolean  @default(true)
  isVerified    Boolean  @default(false)
  
  # Relaciones
  wallet             Wallet?
  gameParticipations GameParticipant[]
  bingoCards         BingoCard[]
  transactions       Transaction[]
  depositRequests    DepositRequest[]
  withdrawalRequests WithdrawalRequest[]
  openpayCustomer    OpenpayCustomer?
}
```

#### Sistema de Juegos
```prisma
model Game {
  id           String      @id @default(cuid())
  title        String
  description  String?
  maxPlayers   Int         @default(500)
  cardPrice    Decimal     @default(5.00)
  totalPrize   Decimal     @default(0.00)
  status       String      @default("SCHEDULED")
  
  # Configuración del juego
  ballsDrawn   String      @default("[]")  # JSON array
  currentBall  Int?
  winningCards String      @default("[]")  # JSON array
  
  # Horarios
  scheduledAt  DateTime
  startedAt    DateTime?
  endedAt      DateTime?
  
  # Relaciones
  participants GameParticipant[]
  bingoCards   BingoCard[]
}
```

#### Cartones de Bingo
```prisma
model BingoCard {
  id             String @id @default(cuid())
  userId         String
  gameId         String
  cardNumber     Int
  isActive       Boolean @default(true)
  markedNumbers  String  @default("[]")  # JSON array
  isWinner       Boolean @default(false)
  winningPattern String?
  
  # Relaciones
  user    User         @relation(fields: [userId], references: [id])
  game    Game         @relation(fields: [gameId], references: [id])
  numbers CardNumber[]
  
  @@unique([gameId, cardNumber])
}
```

#### Sistema de Pagos "Perlas"
```prisma
model Wallet {
  id           String  @id @default(cuid())
  userId       String  @unique
  balance      Decimal @default(0.00)
  dailyLimit   Decimal @default(1000.00)
  monthlyLimit Decimal @default(10000.00)
  isActive     Boolean @default(true)
  isFrozen     Boolean @default(false)
  
  user User @relation(fields: [userId], references: [id])
}

model DepositRequest {
  id            String   @id @default(cuid())
  userId        String
  amount        Decimal
  pearlsAmount  Decimal
  currency      String   @default("PEN")
  paymentMethod String   # BCP, BBVA, YAPE, PLIN, OPENPAY_CARD
  referenceCode String   @unique
  bankReference String?
  status        String   @default("PENDING")
  
  # Integración Openpay
  integrationMethod    String  @default("manual")
  openpayTransactionId String?
  autoApprovalEligible Boolean @default(false)
  
  # Timestamps
  createdAt DateTime @default(now())
  expiresAt DateTime
  
  # Relaciones
  user                User               @relation(fields: [userId], references: [id])
  openpayTransactions OpenpayTransaction[]
}
```

#### Integración Openpay
```prisma
model OpenpayCustomer {
  id                String   @id @default(cuid())
  userId            String   @unique
  openpayCustomerId String   @unique
  email             String
  name              String
  phone             String?
  
  # Relaciones
  user           User                   @relation(fields: [userId], references: [id])
  paymentMethods OpenpayPaymentMethod[]
  transactions   OpenpayTransaction[]
}

model OpenpayTransaction {
  id                   String   @id @default(cuid())
  depositRequestId     String
  openpayTransactionId String   @unique
  openpayChargeId      String?  @unique
  amount               Float
  currency             String   @default("PEN")
  paymentMethod        String
  openpayStatus        String
  customerId           String
  customerEmail        String
  authorizationCode    String?
  
  # Relaciones
  depositRequest DepositRequest  @relation(fields: [depositRequestId], references: [id])
  customer       OpenpayCustomer @relation(fields: [customerId], references: [id])
  webhookEvents  OpenpayWebhookEvent[]
}
```

### Migraciones y Semillas
- **Migraciones automáticas** con Prisma
- **Seeder de datos** de desarrollo
- **Configuraciones bancarias** pre-populadas
- **Usuarios admin** por defecto
- **Patrones de bingo** configurados

---

## 💎 Sistema de Pagos "Perlas"

### Concepto de Perlas
- **1 Perla = 1 Sol Peruano**
- **Moneda virtual interna** del sistema
- **No reembolsable** directamente
- **Convertible a soles** vía retiro bancario
- **Sistema de auditoría completo**

### Flujo de Recarga (Depósito)

#### Métodos Tradicionales Peruanos
1. **Bancos Locales**: BCP, BBVA, Interbank, Scotiabank
2. **Billeteras Digitales**: Yape, Plin
3. **Proceso Manual**: Usuario transfiere → Admin valida → Perlas se acreditan

#### Método Openpay (Automático)
1. **Tarjetas**: Visa, Mastercard, American Express
2. **Transferencias bancarias** automatizadas
3. **Pagos en efectivo** en tiendas
4. **Validación automática** con webhooks

### Flujo de Retiro
1. **Solicitud de retiro** por el usuario
2. **Validación automática** de fondos
3. **Revisión administrativa** manual
4. **Transferencia bancaria** a cuenta del usuario
5. **Confirmación y comprobante**

### Sistema de Comisiones
- **Depósitos tradicionales**: Sin comisión
- **Depósitos Openpay**: 3.5% + IVA
- **Transferencias P2P**: S/ 0.50
- **Retiros bancarios**: Sin comisión (mínimo S/ 50)

### Límites y Controles
- **Depósito mínimo**: S/ 10.00
- **Depósito máximo diario**: S/ 1,000.00
- **Retiro mínimo**: S/ 50.00
- **Retiro máximo mensual**: S/ 10,000.00
- **KYC básico**: Nombre, DNI, teléfono

---

## 🏦 Integración Openpay

### Configuración de Desarrollo
```env
# Mock mode para desarrollo sin pagos reales
OPENPAY_MOCK_MODE=true
OPENPAY_MERCHANT_ID=mock_merchant_12345
OPENPAY_PRIVATE_KEY=sk_mock_private_key_development_12345
OPENPAY_PUBLIC_KEY=pk_mock_public_key_development_12345
OPENPAY_MOCK_DELAY_MS=1000
OPENPAY_MOCK_SUCCESS_RATE=0.95
```

### Métodos de Pago Soportados

#### 💳 Tarjetas de Crédito/Débito
- **Marcas**: Visa, Mastercard, American Express
- **Procesamiento**: Inmediato
- **Tokenización**: Guardar tarjetas para uso futuro
- **3D Secure**: Validación adicional de seguridad

#### 🏦 Transferencias Bancarias
- **Bancos peruanos**: BCP, BBVA, Scotiabank, Interbank, BanBif
- **Procesamiento**: 1-2 días hábiles
- **Sin comisiones adicionales**

#### 🏪 Pagos en Efectivo
- **Tiendas**: Tambo, OXXO, Mass, Full, Repshop
- **Límites**: S/ 10 - S/ 500 por transacción
- **Procesamiento**: 1-3 días hábiles
- **Comisión**: S/ 2.50 por transacción

### Seguridad Openpay
- **Tokenización** de datos sensibles
- **Webhooks** con verificación de firma
- **Encriptación** de comunicaciones
- **Detección de fraude** automática
- **PCI DSS Compliance**

### Webhook Handling
```typescript
// Eventos webhooks manejados:
- charge.succeeded     # Pago exitoso
- charge.failed        # Pago fallido
- charge.cancelled     # Pago cancelado
- charge.expired       # Pago expirado
- transaction.chargeback # Contracargo
```

---

## ⚡ Tiempo Real - WebSockets

### Arquitectura de Tiempo Real
```typescript
// Server Side (Socket.IO)
io.on('connection', (socket) => {
  // Salas por juego
  socket.on('join-game-room', (gameId) => {
    socket.join(`game-${gameId}`);
  });
  
  // Eventos de juego en tiempo real
  socket.on('ball-drawn', (data) => {
    io.to(`game-${data.gameId}`).emit('new-ball-drawn', data);
  });
});
```

### Eventos Implementados

#### 🎲 Eventos de Juego
- **join-game-room**: Unirse a sala de juego específico
- **leave-game-room**: Abandonar sala de juego
- **ball-drawn**: Nueva bola cantada por el sistema
- **mark-number**: Jugador marca número en cartón
- **bingo-claimed**: Jugador reclama BINGO
- **game-state-changed**: Cambios de estado del juego

#### 👨‍💼 Eventos Administrativos
- **join-admin-room**: Admin se une a sala de control
- **admin-call-number**: Admin canta número manualmente
- **admin-reset-game**: Reiniciar juego completamente
- **admin-toggle-game**: Pausar/reanudar juego
- **admin-set-pattern**: Cambiar patrón de juego

#### 🔔 Notificaciones en Tiempo Real
- **player-joined**: Nuevo jugador en la sala
- **player-left**: Jugador abandona la sala
- **bingo-winner**: Anuncio de ganador
- **prize-notification**: Notificación de premio
- **game-status-updated**: Actualizaciones de estado

### Gestión de Conexiones
- **Reconexión automática** del cliente
- **Heartbeat** para detectar desconexiones
- **Salas dinámicas** por juego
- **Estado sincronizado** entre clientes
- **Manejo de errores** de conexión

---

## 🔗 APIs y Endpoints

### Autenticación
```
POST   /api/auth/login          # Iniciar sesión
POST   /api/auth/register       # Registrar usuario
POST   /api/auth/refresh        # Renovar token
POST   /api/auth/logout         # Cerrar sesión
GET    /api/auth/profile        # Obtener perfil
PUT    /api/auth/profile        # Actualizar perfil
```

### Juegos y Bingo
```
GET    /api/games               # Listar juegos disponibles
GET    /api/games/:id           # Obtener juego específico
POST   /api/games/:id/join      # Unirse a juego
GET    /api/games/:id/status    # Estado del juego en tiempo real
POST   /api/games/:id/cards     # Comprar cartones
GET    /api/cards/user          # Mis cartones activos
POST   /api/cards/:id/mark      # Marcar número en cartón
POST   /api/cards/:id/bingo     # Reclamar BINGO
```

### Sistema de Pagos Traditional
```
GET    /api/payment/methods     # Métodos de pago disponibles
POST   /api/payment/deposit     # Crear solicitud de depósito
GET    /api/payment/deposits    # Mis solicitudes de depósito
DELETE /api/payment/deposits/:id # Cancelar solicitud de depósito
POST   /api/payment/withdrawal  # Crear solicitud de retiro
GET    /api/payment/withdrawals # Mis solicitudes de retiro
GET    /api/payment/config      # Configuración del sistema
```

### Openpay Integration
```
GET    /api/openpay/payment-methods      # Métodos Openpay disponibles
POST   /api/openpay/card                 # Pago con tarjeta
POST   /api/openpay/bank-transfer        # Transferencia bancaria
POST   /api/openpay/cash                 # Pago en efectivo
GET    /api/openpay/transaction/:id      # Estado de transacción
GET    /api/openpay/transactions         # Historial de transacciones
POST   /api/webhooks/openpay             # Webhook Openpay
```

### Billetera Digital
```
GET    /api/wallet              # Balance y estado de billetera
GET    /api/wallet/transactions # Historial de transacciones
POST   /api/wallet/transfer     # Transferencia P2P entre usuarios
GET    /api/wallet/limits       # Límites actuales del usuario
```

### Administración
```
GET    /api/admin/payment/deposits       # Gestionar depósitos pendientes
PUT    /api/admin/payment/deposits/:id   # Aprobar/rechazar depósito
GET    /api/admin/payment/withdrawals    # Gestionar retiros
PUT    /api/admin/payment/withdrawals/:id # Procesar retiro
GET    /api/admin/payment/stats          # Estadísticas de pagos
GET    /api/admin/games                  # Gestión de juegos
POST   /api/admin/games                  # Crear nuevo juego
PUT    /api/admin/games/:id              # Actualizar juego
```

### Analytics y Reportes
```
GET    /api/analytics/dashboard          # KPIs principales
GET    /api/analytics/revenue            # Análisis de ingresos
GET    /api/analytics/users              # Análisis de usuarios
GET    /api/analytics/games              # Análisis de juegos
GET    /api/reports/financial            # Reportes financieros
GET    /api/reports/audit                # Logs de auditoría
POST   /api/reports/export               # Exportar reportes
```

---

## 🛡️ Seguridad y Autenticación

### Autenticación JWT
```typescript
interface JWTPayload {
  userId: string;
  email: string;
  role: 'USER' | 'ADMIN';
  iat: number;
  exp: number;
}
```

### Middleware de Seguridad
- **Helmet.js**: Headers de seguridad HTTP
- **CORS**: Control de acceso entre orígenes
- **Rate Limiting**: Control de velocidad de requests
- **Input Validation**: Validación con Zod schemas
- **SQL Injection Protection**: Prisma ORM protección
- **XSS Protection**: Sanitización de entrada

### Autorización por Roles
```typescript
// Middleware de autorización
const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};
```

### Auditoría y Compliance
- **Logs de auditoría** para todas las transacciones
- **Registro de accesos** administrativos
- **Trazabilidad completa** de pagos
- **Reportes de compliance** para reguladores
- **Encriptación** de datos sensibles

### Validaciones de Seguridad
- **Verificación de email** (opcional)
- **Validación de DNI** para retiros grandes
- **Límites de transacción** configurables
- **Detección de patrones** sospechosos
- **Bloqueo automático** de cuentas irregulares

---

## 📊 Monitoreo y Analytics

### Métricas del Sistema
- **Performance**: Tiempo de respuesta, throughput
- **Disponibilidad**: Uptime, health checks
- **Errores**: Rate de errores, logs de excepción
- **Recursos**: CPU, memoria, conexiones DB

### Analytics de Negocio
- **Usuarios**: Registros, retención, actividad
- **Juegos**: Participación, duración, premios
- **Pagos**: Volumen, métodos, conversión
- **Revenue**: Ingresos por periodo, método, usuario

### Logging Estructurado
```typescript
// Sistema de logs personalizado
logger.info('User login', {
  userId: user.id,
  email: user.email,
  ip: req.ip,
  userAgent: req.headers['user-agent']
});

logger.business('Payment processed', {
  userId: payment.userId,
  amount: payment.amount,
  method: payment.method,
  transactionId: payment.id
});
```

### Health Checks
```
GET /health                    # Estado básico del sistema
GET /api/performance/health    # Estado detallado con métricas
```

---

## 🚀 Deployment y DevOps

### Environments
- **Development**: Local con SQLite y mocks
- **Staging**: Pre-producción con PostgreSQL
- **Production**: Producción completa

### Containerización Docker
```dockerfile
# Backend Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
COPY prisma ./prisma
RUN npx prisma generate
EXPOSE 3001
CMD ["npm", "start"]
```

### CI/CD Pipeline
```yaml
# GitHub Actions workflow
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run Tests
        run: npm test
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Server
        run: ./scripts/deploy.sh
```

### Configuración de Producción
- **PostgreSQL** con conexiones pooled
- **Redis** para cache y sessions
- **Nginx** como reverse proxy
- **SSL/TLS** con Let's Encrypt
- **PM2** para process management
- **Monitoring** con Prometheus/Grafana

---

## 📋 Scripts y Comandos

### Backend Development
```bash
npm run dev              # Desarrollo con hot-reload
npm run build           # Compilar TypeScript
npm run start           # Iniciar en producción
npm run db:migrate      # Ejecutar migraciones
npm run db:seed         # Poblar datos de prueba
npm test               # Tests completos
npm run test:openpay   # Tests específicos Openpay
npm run lint           # Linting de código
```

### Frontend Development
```bash
npm run dev            # Servidor de desarrollo
npm run build         # Build para producción
npm run preview       # Preview del build
npm run test:e2e      # Tests end-to-end
npm run type-check    # Verificación TypeScript
```

### Database Management
```bash
npm run prisma:studio    # Interface visual de DB
npm run prisma:migrate   # Nueva migración
npm run prisma:reset     # Reset completo de DB
npm run openpay:verify   # Verificar config Openpay
```

---

## 📚 Documentación Adicional

### Guías Técnicas
- [API Documentation](../API_DOCUMENTATION.md)
- [Openpay Development Setup](../docs/OPENPAY_DEVELOPMENT_SETUP.md)
- [Endpoint 404 Investigation](../docs/ENDPOINT_404_INVESTIGATION.md)
- [Port Management](../docs/PORT_MANAGEMENT.md)

### Guías de Uso
- [Guía Rápida](../GUIA_RAPIDA.md)
- [Sistema Perlas Progreso](../SISTEMA_PERLAS_PROGRESO.md)
- [Testing Guide](../TESTING.md)
- [PWA README](../frontend/PWA-README.md)

### Reportes de Desarrollo
- [Implementation Summary](../IMPLEMENTATION_SUMMARY.md)
- [Mobile First Report](../MOBILE_FIRST_REPORT.md)
- [Login Problem Solution](../LOGIN_PROBLEM_SOLUTION_REPORT.md)
- [Main Menu Verification](../MAIN_MENU_VERIFICATION_REPORT.md)

---

## 🎯 Estado Actual del Proyecto

### ✅ Completado
- ✅ **Backend API completo** con todos los endpoints
- ✅ **Frontend PWA responsivo** mobile-first
- ✅ **Sistema de autenticación** JWT completo
- ✅ **Juegos de bingo** en tiempo real funcional
- ✅ **Sistema de pagos tradicional** implementado
- ✅ **Integración Openpay** con mock completo
- ✅ **Panel administrativo** funcional
- ✅ **Base de datos** con migraciones completas
- ✅ **WebSockets** para tiempo real
- ✅ **Tests E2E** con Playwright
- ✅ **Documentación técnica** completa

### 🚧 En Progreso
- 🚧 **Tests unitarios** adicionales para coverage 100%
- 🚧 **Optimización de performance** frontend
- 🚧 **Monitoring** avanzado con métricas
- 🚧 **Push notifications** para PWA

### 📋 Próximos Pasos
- 📋 **Deployment a producción** con PostgreSQL
- 📋 **Configuración Openpay real** (credenciales producción)
- 📋 **Optimizaciones de base de datos**
- 📋 **Implementación de cache avanzado**
- 📋 **Monitoring y alertas** automatizadas

---

## 👥 Equipo de Desarrollo

**Arquitectura y Backend**: Desarrollo completo del sistema backend, integración Openpay, sistema de pagos, APIs RESTful y WebSockets.

**Frontend y UX**: Desarrollo PWA React, diseño mobile-first, componentes reutilizables, estado global Redux.

**DevOps y Testing**: Configuración CI/CD, containerización Docker, tests automatizados E2E, documentación técnica.

---

*Documentación actualizada: $(date)  
Versión del proyecto: 1.0.0  
Estado: Producción Ready*
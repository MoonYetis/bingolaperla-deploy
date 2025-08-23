# 🎮 Funcionalidades Detalladas - Bingo La Perla

## 📋 Índice
- [Sistema de Juego Bingo](#sistema-de-juego-bingo)
- [Sistema de Pagos "Perlas"](#sistema-de-pagos-perlas)
- [Integración Openpay](#integración-openpay)
- [Panel Administrativo](#panel-administrativo)
- [Sistema de Usuarios](#sistema-de-usuarios)
- [Tiempo Real y WebSockets](#tiempo-real-y-websockets)
- [Reportes y Analytics](#reportes-y-analytics)
- [PWA y Experiencia Mobile](#pwa-y-experiencia-mobile)

---

## 🎲 Sistema de Juego Bingo

### Mecánica del Bingo de 75 Bolas

#### Configuración del Cartón
- **Tamaño**: 5x5 grid (25 espacios)
- **Columnas**: B-I-N-G-O con rangos específicos
  - **B**: Números 1-15
  - **I**: Números 16-30
  - **N**: Números 31-45 (centro es FREE)
  - **G**: Números 46-60
  - **O**: Números 61-75
- **Centro Libre**: Casilla central marcada automáticamente

#### Patrones de Juego Soportados
```typescript
enum BingoPattern {
  LINE_HORIZONTAL = 'line_horizontal',    # Cualquier línea horizontal
  LINE_VERTICAL = 'line_vertical',        # Cualquier línea vertical
  LINE_DIAGONAL = 'line_diagonal',        # Cualquier diagonal
  FOUR_CORNERS = 'four_corners',          # Las cuatro esquinas
  SMALL_DIAMOND = 'small_diamond',        # Diamante pequeño (5 casillas)
  LARGE_DIAMOND = 'large_diamond',        # Diamante grande (9 casillas)
  SMALL_PLUS = 'small_plus',             # Cruz pequeña (5 casillas)
  LARGE_PLUS = 'large_plus',             # Cruz grande (9 casillas)
  LETTER_X = 'letter_x',                 # Forma de X (9 casillas)
  OUTSIDE_EDGE = 'outside_edge',         # Borde exterior (16 casillas)
  FULL_CARD = 'full_card',               # Cartón completo (24 casillas)
  BLACKOUT = 'blackout'                  # Todas las casillas (25 casillas)
}
```

#### Estados del Juego
```typescript
enum GameStatus {
  SCHEDULED = 'SCHEDULED',     # Programado, esperando inicio
  OPEN = 'OPEN',              # Abierto para compra de cartones
  IN_PROGRESS = 'IN_PROGRESS', # En curso, cantando números
  PAUSED = 'PAUSED',          # Pausado por admin
  COMPLETED = 'COMPLETED',     # Terminado con ganador
  CANCELLED = 'CANCELLED'      # Cancelado por admin
}
```

### Flujo de Juego Completo

#### 1. Pre-Juego
1. **Creación de Juego** (Admin)
   - Configurar título, descripción
   - Establecer precio de cartón
   - Programar fecha/hora de inicio
   - Definir patrón ganador
   - Configurar premio total

2. **Apertura de Ventas**
   - Estado cambia a `OPEN`
   - Usuarios pueden comprar cartones
   - Cartones generados automáticamente
   - Validación de duplicados

#### 2. Durante el Juego
1. **Inicio Automático**
   - Estado cambia a `IN_PROGRESS`
   - WebSocket notifica a todos los jugadores
   - Comienza el sorteo de bolas

2. **Mecánica de Sorteo**
   ```typescript
   class GameService {
     async drawBall(gameId: string): Promise<number> {
       const game = await this.getGame(gameId);
       const drawnBalls = JSON.parse(game.ballsDrawn);
       const availableBalls = this.getAvailableBalls(drawnBalls);
       
       const newBall = this.randomBall(availableBalls);
       drawnBalls.push(newBall);
       
       await this.updateGame(gameId, {
         ballsDrawn: JSON.stringify(drawnBalls),
         currentBall: newBall
       });
       
       // Notificar en tiempo real
       this.notifyBallDrawn(gameId, newBall, drawnBalls);
       
       return newBall;
     }
   }
   ```

3. **Marcado de Cartones**
   - Usuarios marcan números automáticamente
   - Verificación de números válidos
   - Actualización en tiempo real
   - Detección de patrones ganadores

#### 3. Detección de Ganadores
```typescript
class PatternService {
  checkWinningPattern(card: BingoCard, pattern: BingoPattern): boolean {
    const markedNumbers = JSON.parse(card.markedNumbers);
    
    switch (pattern) {
      case BingoPattern.LINE_HORIZONTAL:
        return this.checkHorizontalLines(markedNumbers);
      case BingoPattern.FULL_CARD:
        return markedNumbers.length >= 24; // 25 - 1 (centro libre)
      // ... otros patrones
    }
  }
  
  private checkHorizontalLines(marked: number[]): boolean {
    const rows = [
      [0, 1, 2, 3, 4],      // Fila 1
      [5, 6, 7, 8, 9],      // Fila 2
      [10, 11, 12, 13, 14], // Fila 3 (incluye centro libre)
      [15, 16, 17, 18, 19], // Fila 4
      [20, 21, 22, 23, 24]  # Fila 5
    ];
    
    return rows.some(row => 
      row.every(pos => marked.includes(pos) || pos === 12)
    );
  }
}
```

### Administración de Juegos

#### Controles en Tiempo Real
- **Cantar números manualmente** por admin
- **Pausar/reanudar** juego en cualquier momento
- **Cambiar patrón** durante el juego
- **Validar reclamaciones** de BINGO
- **Ver estadísticas** en tiempo real

#### Dashboard de Juego
```typescript
interface GameDashboard {
  activeGames: Game[];
  playersOnline: number;
  currentRevenue: number;
  cardsPlaying: number;
  averageGameDuration: number;
  popularPatterns: PatternStats[];
}
```

---

## 💎 Sistema de Pagos "Perlas"

### Concepto y Funcionamiento

#### ¿Qué son las Perlas?
- **Moneda virtual interna** del sistema
- **Equivalencia**: 1 Perla = 1 Sol Peruano
- **Propósito**: Facilitar compras rápidas de cartones
- **Regulación**: Cumple normativas de monedas virtuales en Perú

#### Ventajas del Sistema
- ✅ **Compras instantáneas** de cartones
- ✅ **No requiere datos bancarios** en cada transacción
- ✅ **Transferencias P2P** entre usuarios
- ✅ **Control parental** con límites configurables
- ✅ **Trazabilidad completa** para auditorías

### Métodos de Recarga

#### 1. Métodos Tradicionales Peruanos

##### Bancos Locales
```typescript
const bankMethods = [
  {
    code: 'BCP',
    name: 'Banco de Crédito del Perú',
    account: '123-456-789-012',
    cci: '00212312345678901234',
    minAmount: 10.00,
    maxAmount: 1000.00,
    processingTime: '24 horas'
  },
  {
    code: 'BBVA',
    name: 'BBVA Continental',
    account: '987-654-321-098',
    processingTime: '24 horas'
  }
  // ... otros bancos
];
```

##### Billeteras Digitales
```typescript
const digitalWallets = [
  {
    code: 'YAPE',
    name: 'Yape',
    phone: '+51-987-654-321',
    minAmount: 10.00,
    maxAmount: 500.00,
    processingTime: '30 minutos'
  },
  {
    code: 'PLIN',
    name: 'Plin',
    phone: '+51-123-456-789',
    processingTime: '30 minutos'
  }
];
```

#### 2. Flujo de Recarga Tradicional
1. **Usuario solicita recarga**
   - Selecciona método de pago
   - Ingresa monto deseado
   - Recibe código de referencia único

2. **Transferencia bancaria**
   - Usuario transfiere a cuenta del negocio
   - Incluye código de referencia en concepto
   - Opcional: sube comprobante de pago

3. **Validación administrativa**
   - Admin revisa transferencias bancarias
   - Verifica monto y código de referencia
   - Aprueba o rechaza la solicitud

4. **Acreditación automática**
   - Perlas se acreditan a la billetera
   - Usuario recibe notificación
   - Transacción queda registrada

### Transferencias P2P

#### Funcionalidad
```typescript
interface P2PTransfer {
  fromUserId: string;
  toUserId: string;
  amount: number;           // En Perlas
  commission: number;       // S/ 0.50 por transferencia
  reference: string;        // Código único
  description?: string;     // Concepto opcional
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
}
```

#### Proceso de Transferencia
1. **Validaciones**
   - Saldo suficiente (monto + comisión)
   - Usuario receptor existe y está activo
   - Límites diarios no superados

2. **Ejecución**
   - Débito inmediato del remitente
   - Crédito inmediato al receptor
   - Registro de comisión al sistema

3. **Notificaciones**
   - Push notification a ambos usuarios
   - Email de confirmación
   - Entrada en historial de transacciones

### Sistema de Retiros

#### Proceso de Conversión
1. **Solicitud de retiro**
   - Mínimo: 50 Perlas (S/ 50)
   - Máximo mensual: 10,000 Perlas
   - Datos bancarios requeridos

2. **Validación administrativa**
   - Verificación de identidad (DNI)
   - Validación de datos bancarios
   - Revisión antilavado de activos

3. **Transferencia bancaria**
   - Procesamiento manual por admin
   - Transferencia a cuenta del usuario
   - Comprobante de transferencia

#### Datos Requeridos para Retiro
```typescript
interface WithdrawalRequest {
  pearlsAmount: number;
  bankCode: string;         // BCP, BBVA, etc.
  accountNumber: string;
  accountType: 'SAVINGS' | 'CHECKING';
  accountHolderName: string;
  accountHolderDni: string;
  userNotes?: string;
}
```

### Comisiones y Límites

#### Estructura de Comisiones
- **Depósitos tradicionales**: Gratuito
- **Depósitos Openpay**: 3.5% + IVA
- **Transferencias P2P**: S/ 0.50 fijo
- **Retiros bancarios**: Gratuito (mín. S/ 50)

#### Límites por Usuario
```typescript
interface UserLimits {
  dailyDepositLimit: 1000.00;      // S/ 1,000 diarios
  monthlyWithdrawalLimit: 10000.00; // S/ 10,000 mensuales
  p2pDailyLimit: 500.00;           // S/ 500 P2P diarios
  minWithdrawal: 50.00;            // Mínimo retiro S/ 50
  maxSingleDeposit: 5000.00;       // Máximo depósito único
}
```

---

## 🏦 Integración Openpay

### Configuración y Setup

#### Credenciales de Desarrollo
```env
# Modo mock para desarrollo sin pagos reales
OPENPAY_MOCK_MODE=true
OPENPAY_PRODUCTION=false
OPENPAY_MERCHANT_ID=mock_merchant_12345
OPENPAY_PRIVATE_KEY=sk_mock_private_key_development_12345
OPENPAY_PUBLIC_KEY=pk_mock_public_key_development_12345

# Configuración de comportamiento mock
OPENPAY_MOCK_DELAY_MS=1000        # Simular latencia de 1 segundo
OPENPAY_MOCK_SUCCESS_RATE=0.95    # 95% de éxito en transacciones
```

### Métodos de Pago Implementados

#### 1. Tarjetas de Crédito/Débito

##### Proceso de Pago
```typescript
class OpenpayController {
  async processCardPayment(req: Request, res: Response): Promise<void> {
    const { amount, token, deviceSessionId, customerEmail } = req.body;
    const userId = req.user!.userId;
    
    // Crear transacción en Openpay
    const result = await this.openpayService.processCardPayment({
      userId,
      amount,
      token,        // Token de tarjeta del frontend
      deviceSessionId, // Para detección de fraude
      customerEmail,
      customerName: req.user!.fullName
    });
    
    if (result.success) {
      // Acreditar Perlas automáticamente
      await this.walletService.creditPerlas(userId, amount);
    }
  }
}
```

##### Tokenización de Tarjetas
- **PCI Compliance**: Openpay maneja datos sensibles
- **Guardar tarjetas**: Opción para uso futuro
- **3D Secure**: Validación adicional automática
- **Detección de fraude**: Scoring automático

#### 2. Transferencias Bancarias

##### Bancos Soportados
- Banco de Crédito del Perú (BCP)
- BBVA Continental
- Scotiabank Perú
- Interbank
- BanBif

##### Proceso
```typescript
async processBankTransfer(transferData: BankTransferData) {
  // Crear solicitud en Openpay
  const openpayCharge = await this.openpayClient.charges.create({
    method: 'bank_transfer',
    amount: transferData.amount,
    customer: transferData.customerId,
    description: `Recarga de ${transferData.amount} Perlas`
  });
  
  // Devolver instrucciones de pago
  return {
    success: true,
    paymentInstructions: {
      bank: openpayCharge.payment_method.bank,
      account: openpayCharge.payment_method.account_number,
      clabe: openpayCharge.payment_method.clabe,
      reference: openpayCharge.payment_method.reference,
      dueDate: openpayCharge.due_date
    }
  };
}
```

#### 3. Pagos en Efectivo

##### Tiendas Afiliadas
- **Tambo**: Cadena de conveniencia líder
- **OXXO**: Tiendas de conveniencia
- **Mass**: Supermercados
- **Full**: Farmacias y tiendas
- **Repshop**: Red de pagos

##### Límites y Restricciones
```typescript
const cashPaymentLimits = {
  minAmount: 10.00,         // Mínimo S/ 10
  maxAmount: 500.00,        // Máximo S/ 500 por transacción
  commission: 2.50,         // Comisión fija S/ 2.50
  processingTime: '1-3 días hábiles'
};
```

### Webhook Handling

#### Eventos Procesados
```typescript
enum OpenpayWebhookEvents {
  CHARGE_SUCCEEDED = 'charge.succeeded',
  CHARGE_FAILED = 'charge.failed',
  CHARGE_CANCELLED = 'charge.cancelled',
  CHARGE_EXPIRED = 'charge.expired',
  TRANSACTION_CHARGEBACK = 'transaction.chargeback'
}
```

#### Procesamiento de Webhooks
```typescript
class OpenpayWebhookController {
  async handleWebhook(req: Request, res: Response): Promise<void> {
    // Verificar firma de seguridad
    const signature = req.headers['openpay-signature'];
    if (!this.verifyWebhookSignature(req.body, signature)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    const event = req.body;
    
    switch (event.type) {
      case 'charge.succeeded':
        await this.handleChargeSucceeded(event.data.object);
        break;
      case 'charge.failed':
        await this.handleChargeFailed(event.data.object);
        break;
    }
    
    res.status(200).json({ received: true });
  }
  
  private async handleChargeSucceeded(charge: OpenpayCharge) {
    // Buscar transacción local
    const transaction = await this.findTransactionByOpenpayId(charge.id);
    
    // Acreditar Perlas automáticamente
    await this.walletService.creditPerlas(
      transaction.userId, 
      charge.amount
    );
    
    // Actualizar estado de transacción
    await this.updateTransactionStatus(transaction.id, 'COMPLETED');
    
    // Notificar al usuario
    await this.notificationService.sendPaymentConfirmation(
      transaction.userId,
      charge.amount
    );
  }
}
```

### Mock Implementation para Desarrollo

#### Simulación Realista
```typescript
class OpenpayMockService {
  async processCardPayment(data: CardPaymentData): Promise<PaymentResult> {
    // Simular latencia real
    await this.delay(this.config.mockDelayMs);
    
    // Simular tasa de éxito configurable
    const isSuccessful = Math.random() < this.config.mockSuccessRate;
    
    if (isSuccessful) {
      return {
        success: true,
        transactionId: `mock_txn_${Date.now()}`,
        openpayChargeId: `mock_charge_${Date.now()}`,
        status: 'completed',
        authorizationCode: `AUTH${Math.random().toString(36).substr(2, 6).toUpperCase()}`
      };
    } else {
      return {
        success: false,
        errorCode: 'MOCK_FAILURE',
        errorMessage: 'Mock payment failure for testing'
      };
    }
  }
}
```

---

## 👨‍💼 Panel Administrativo

### Dashboard Principal

#### KPIs en Tiempo Real
```typescript
interface AdminDashboard {
  todayStats: {
    revenue: number;
    newUsers: number;
    activeGames: number;
    totalTransactions: number;
  };
  
  gameStats: {
    gamesPlayed: number;
    averageParticipants: number;
    totalPrizesAwarded: number;
    mostPopularPattern: string;
  };
  
  paymentStats: {
    pendingDeposits: number;
    pendingWithdrawals: number;
    openpayTransactions: number;
    traditionalTransactions: number;
  };
}
```

### Gestión de Pagos

#### Validación de Depósitos
1. **Lista de pendientes** con filtros
2. **Vista detallada** de cada solicitud
3. **Validación** con comprobantes
4. **Aprobación/rechazo** con comentarios
5. **Acreditación automática** de Perlas

#### Proceso de Validación
```typescript
interface DepositValidation {
  id: string;
  userId: string;
  amount: number;
  paymentMethod: string;
  referenceCode: string;
  bankReference?: string;
  proofImage?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNotes?: string;
  createdAt: Date;
  expiresAt: Date;
}

class PaymentAdminController {
  async approveDeposit(depositId: string, adminId: string): Promise<void> {
    // Actualizar estado
    await this.updateDepositStatus(depositId, 'APPROVED', adminId);
    
    // Acreditar Perlas
    const deposit = await this.getDeposit(depositId);
    await this.walletService.creditPerlas(deposit.userId, deposit.pearlsAmount);
    
    // Registrar auditoría
    await this.auditLogger.log({
      action: 'DEPOSIT_APPROVED',
      adminId,
      entityId: depositId,
      amount: deposit.amount
    });
    
    // Notificar usuario
    await this.notificationService.sendDepositApproved(deposit.userId);
  }
}
```

### Gestión de Juegos

#### Creación de Juegos
```typescript
interface GameCreation {
  title: string;
  description?: string;
  scheduledAt: Date;
  cardPrice: number;
  pattern: BingoPattern;
  maxPlayers: number;
  prizeStructure: {
    winnerPercentage: number;    # % del total para ganador
    housePercentage: number;     # % comisión de la casa
    nextGamePercentage: number;  # % para siguiente juego
  };
}
```

#### Control en Tiempo Real
- **Monitor de juegos activos**
- **Intervención manual** en sorteos
- **Chat con jugadores** (funcionalidad preparada)
- **Estadísticas en vivo**
- **Grabación de sesiones** para auditoría

### Gestión de Usuarios

#### Perfiles de Usuario
```typescript
interface UserProfile {
  basicInfo: {
    id: string;
    email: string;
    username: string;
    fullName?: string;
    phone?: string;
    dni?: string;
  };
  
  accountStatus: {
    isActive: boolean;
    isVerified: boolean;
    registrationDate: Date;
    lastLogin: Date;
  };
  
  walletInfo: {
    pearlsBalance: number;
    totalDeposited: number;
    totalWithdrawn: number;
    pendingTransactions: number;
  };
  
  gameStats: {
    gamesPlayed: number;
    cardsPlayed: number;
    totalWon: number;
    winRate: number;
  };
}
```

#### Acciones Administrativas
- **Suspender/reactivar** cuentas
- **Ajustar balances** con justificación
- **Ver historial completo** de actividad
- **Generar reportes** por usuario
- **Aplicar límites** personalizados

### Sistema de Reportes

#### Reportes Financieros
1. **Ingresos diarios/mensuales**
2. **Análisis por método de pago**
3. **Comisiones generadas**
4. **Pendientes por procesar**
5. **Proyecciones de ingresos**

#### Reportes Operativos
1. **Actividad de usuarios**
2. **Performance de juegos**
3. **Tiempos de procesamiento**
4. **Errores y excepciones**
5. **Métricas de satisfacción**

#### Exportación de Datos
```typescript
interface ReportExport {
  format: 'CSV' | 'XLSX' | 'PDF';
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  filters: {
    userIds?: string[];
    paymentMethods?: string[];
    gameIds?: string[];
    transactionTypes?: string[];
  };
  includePersonalData: boolean; // Para compliance GDPR
}
```

---

## 👤 Sistema de Usuarios

### Registro y Autenticación

#### Proceso de Registro
```typescript
interface UserRegistration {
  email: string;
  username: string;
  password: string;        // Mínimo 8 caracteres
  fullName?: string;
  phone?: string;
  acceptTerms: boolean;    // Requerido
  acceptMarketing?: boolean; // Opcional
}
```

#### Validaciones
- **Email único** en el sistema
- **Username único** disponible
- **Password seguro** con políticas
- **Términos y condiciones** obligatorios
- **Verificación de email** opcional

### Perfiles de Usuario

#### Información Básica
- **Datos personales**: Nombre, teléfono, DNI
- **Preferencias**: Notificaciones, idioma
- **Configuración**: Límites, privacidad
- **Estado de cuenta**: Verificación, restricciones

#### Configuración de Privacidad
```typescript
interface PrivacySettings {
  showUsernameInGame: boolean;      // Mostrar nombre en juegos
  allowP2PTransfers: boolean;       // Recibir transferencias
  emailNotifications: boolean;      // Notificaciones por email
  pushNotifications: boolean;       // Notificaciones push
  marketingCommunications: boolean; // Marketing y ofertas
}
```

### Gamificación y Logros

#### Sistema de Niveles (Preparado)
```typescript
interface UserLevel {
  currentLevel: number;
  experiencePoints: number;
  nextLevelPoints: number;
  levelName: string;
  perks: string[];
}

const userLevels = [
  { level: 1, name: 'Principiante', requiredXP: 0, perks: [] },
  { level: 2, name: 'Aficionado', requiredXP: 100, perks: ['5% descuento cartones'] },
  { level: 3, name: 'Experto', requiredXP: 500, perks: ['Límites aumentados'] },
  { level: 4, name: 'Maestro', requiredXP: 1000, perks: ['Soporte prioritario'] },
  { level: 5, name: 'Leyenda', requiredXP: 2500, perks: ['Bonos especiales'] }
];
```

#### Logros y Badges (Preparado)
- **Primeros pasos**: Primer cartón, primera victoria
- **Racha ganadora**: 3, 5, 10 victorias consecutivas
- **Coleccionista**: Completar diferentes patrones
- **Social**: Transferencias P2P, invitar amigos
- **Fidelidad**: Días consecutivos jugando

---

## ⚡ Tiempo Real y WebSockets

### Arquitectura de Tiempo Real

#### Gestión de Salas
```typescript
class SocketManager {
  // Sala por juego activo
  joinGameRoom(socket: Socket, gameId: string) {
    socket.join(`game-${gameId}`);
    socket.emit('joined-game-room', { gameId, timestamp: Date.now() });
  }
  
  // Sala administrativa
  joinAdminRoom(socket: Socket, gameId: string) {
    socket.join(`admin-${gameId}`);
    socket.emit('joined-admin-room', { gameId });
  }
  
  // Notificar nueva bola a todos los jugadores
  broadcastBallDrawn(gameId: string, ball: number, allBalls: number[]) {
    this.io.to(`game-${gameId}`).emit('new-ball-drawn', {
      gameId,
      ball,
      ballsDrawn: allBalls,
      timestamp: Date.now()
    });
  }
}
```

### Eventos Implementados

#### Eventos de Jugador
```typescript
// Cliente se une a juego
socket.on('join-game-room', (gameId) => {
  socket.join(`game-${gameId}`);
  updatePlayerCount(gameId);
});

// Marcar número en cartón
socket.on('mark-number', (data) => {
  const { gameId, cardId, number } = data;
  markNumberOnCard(cardId, number);
  socket.emit('number-marked', { cardId, number });
});

// Reclamar BINGO
socket.on('bingo-claimed', (data) => {
  const { gameId, cardId, pattern, userId } = data;
  if (validateBingo(cardId, pattern)) {
    io.to(`game-${gameId}`).emit('bingo-winner', data);
    processWinner(userId, cardId, pattern);
  }
});
```

#### Eventos Administrativos
```typescript
// Admin canta número manualmente
socket.on('admin-call-number', (data) => {
  const { gameId, number } = data;
  if (validateAdminPermission(socket.userId)) {
    addBallToGame(gameId, number);
    io.to(`game-${gameId}`).emit('number-called', { number, gameId });
  }
});

// Admin pausa/reanuda juego
socket.on('admin-toggle-game', (data) => {
  const { gameId, status } = data;
  updateGameStatus(gameId, status);
  io.to(`game-${gameId}`).emit('game-status-changed', { status, gameId });
});
```

### Sincronización y Estado

#### Manejo de Reconexiones
```typescript
socket.on('reconnect', () => {
  // Enviar estado actual del juego
  const gameState = getCurrentGameState(socket.currentGameId);
  socket.emit('game-state-sync', gameState);
});

socket.on('disconnect', (reason) => {
  logger.info('Player disconnected', { 
    socketId: socket.id, 
    reason,
    gameId: socket.currentGameId 
  });
});
```

#### Estado Compartido
```typescript
interface GameState {
  id: string;
  status: GameStatus;
  currentBall: number | null;
  ballsDrawn: number[];
  playersCount: number;
  cardsInPlay: number;
  timeElapsed: number;
  winnerFound: boolean;
}
```

---

## 📊 Reportes y Analytics

### Métricas de Negocio

#### KPIs Principales
```typescript
interface BusinessKPIs {
  revenue: {
    daily: number;
    monthly: number;
    yearly: number;
    growth: number;        // % crecimiento vs período anterior
  };
  
  users: {
    total: number;
    active: number;        // Últimos 30 días
    new: number;          // Nuevos registros
    retention: number;     // % retención 7 días
  };
  
  games: {
    gamesPlayed: number;
    averageParticipants: number;
    averageRevenue: number;
    completionRate: number; // % juegos terminados
  };
  
  payments: {
    totalVolume: number;
    openpayPercentage: number;
    traditionalPercentage: number;
    averageTicket: number;
  };
}
```

#### Analytics de Usuario
```typescript
interface UserAnalytics {
  demographic: {
    ageGroups: Record<string, number>;
    geoDistribution: Record<string, number>;
    deviceTypes: Record<string, number>;
  };
  
  behavior: {
    averageSessionDuration: number;
    gamesPerSession: number;
    preferredPatterns: string[];
    peakHours: number[];
  };
  
  monetization: {
    lifetimeValue: number;
    averageDeposit: number;
    paymentMethodPreference: Record<string, number>;
    churnRate: number;
  };
}
```

### Reportes Financieros

#### Análisis de Ingresos
1. **Ingresos por fuente**
   - Venta de cartones
   - Comisiones Openpay
   - Comisiones P2P
   - Comisiones de retiro

2. **Análisis de costos**
   - Costos operativos
   - Comisiones de pago
   - Premios pagados
   - Marketing y adquisición

3. **Rentabilidad**
   - Margen bruto por juego
   - ROI por usuario
   - Análisis de break-even
   - Proyecciones financieras

#### Reportes de Compliance
```typescript
interface ComplianceReport {
  period: { startDate: Date; endDate: Date };
  
  transactions: {
    total: number;
    volume: number;
    averageTicket: number;
    largeTransactions: Transaction[]; // >S/ 1,000
  };
  
  users: {
    newRegistrations: number;
    kycCompleted: number;
    suspended: number;
    flaggedAccounts: User[];
  };
  
  auditTrail: {
    adminActions: AuditLog[];
    systemEvents: SystemEvent[];
    errorEvents: ErrorEvent[];
  };
}
```

### Dashboard en Tiempo Real

#### Visualizaciones
- **Gráficos de ingresos** por período
- **Métricas de usuarios** activos
- **Estado de juegos** en vivo
- **Queue de transacciones** pendientes
- **Alertas del sistema** automáticas

#### Alertas Automáticas
```typescript
interface SystemAlerts {
  // Alertas financieras
  unusualTransactionVolume: boolean;
  pendingDepositsBacklog: boolean;
  highWithdrawalRequests: boolean;
  
  // Alertas técnicas
  highErrorRate: boolean;
  slowResponseTimes: boolean;
  databaseConnectivity: boolean;
  
  // Alertas de negocio
  lowUserActivity: boolean;
  gameCompletionIssues: boolean;
  paymentGatewayProblems: boolean;
}
```

---

## 📱 PWA y Experiencia Mobile

### Características PWA

#### Manifest de Aplicación
```json
{
  "name": "Bingo La Perla",
  "short_name": "Bingo",
  "description": "Juega Bingo de 75 bolas en línea",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#1a1a2e",
  "theme_color": "#0f172a",
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "categories": ["games", "entertainment"],
  "lang": "es-ES"
}
```

#### Service Worker
```typescript
// Cache strategies implementadas
const CACHE_STRATEGIES = {
  static: 'cache-first',      // CSS, JS, imágenes
  api: 'network-first',       # APIs dinámicas
  fallback: 'cache-only'      // Página offline
};

// Offline fallback
self.addEventListener('fetch', (event) => {
  if (event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match('/offline.html'))
    );
  }
});
```

### Diseño Mobile-First

#### Responsive Breakpoints
```css
/* Tailwind CSS breakpoints utilizados */
sm: 640px   /* Teléfonos grandes */
md: 768px   /* Tablets */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Pantallas grandes */
```

#### Componentes Adaptativos
```typescript
// Cartón de bingo responsivo
const BingoCard = ({ numbers, markedNumbers }) => {
  return (
    <div className="
      grid grid-cols-5 gap-1 
      w-full max-w-xs mx-auto
      sm:max-w-sm sm:gap-2
      md:max-w-md
    ">
      {numbers.map((number, index) => (
        <BingoCell
          key={index}
          number={number}
          isMarked={markedNumbers.includes(index)}
          className="
            aspect-square text-xs
            sm:text-sm
            md:text-base
          "
        />
      ))}
    </div>
  );
};
```

### Optimizaciones de Performance

#### Lazy Loading
```typescript
// Carga perezosa de páginas
const GamePage = lazy(() => import('./pages/GamePage'));
const WalletPage = lazy(() => import('./pages/WalletPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));

// Preload de componentes críticos
const BingoCard = lazy(() => 
  import('./components/bingo/BingoCard').then(module => ({
    default: module.BingoCard
  }))
);
```

#### Optimización de Bundle
```typescript
// Vite configuration para optimización
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          redux: ['@reduxjs/toolkit', 'react-redux'],
          ui: ['lucide-react', 'tailwind-merge'],
          socket: ['socket.io-client']
        }
      }
    }
  }
});
```

### Funcionalidades Offline

#### Datos Cacheados
- **Perfil de usuario** y configuraciones
- **Historial de transacciones** reciente
- **Últimos juegos** jugados
- **Imágenes y assets** estáticos

#### Funcionalidad Limitada Offline
- **Ver historial** de transacciones
- **Consultar balance** (último conocido)
- **Ver reglas** del juego
- **Contactar soporte** (formulario)

#### Sincronización al Reconectar
```typescript
// Hook para manejo de estado offline/online
const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingActions, setPendingActions] = useState([]);
  
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      // Sincronizar acciones pendientes
      await syncPendingActions(pendingActions);
      setPendingActions([]);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', () => setIsOnline(false));
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', () => setIsOnline(false));
    };
  }, [pendingActions]);
  
  return { isOnline, addPendingAction };
};
```

---

*Documentación actualizada con todas las funcionalidades implementadas y en desarrollo.*
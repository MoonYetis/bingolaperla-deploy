# API Specifications - Bingo La Perla

## 📡 REST API Endpoints

### 🔐 Authentication Service
Base URL: `/api/auth`

#### POST /api/auth/login
```json
Request:
{
  "email": "user@example.com",
  "password": "securepassword"
}

Response:
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "username": "username",
    "role": "USER",
    "balance": 0.00,
    "pearlsBalance": 0.00
  }
}
```

#### POST /api/auth/register
```json
Request:
{
  "email": "user@example.com",
  "username": "username",
  "password": "securepassword",
  "fullName": "Full Name"
}

Response:
{
  "message": "User created successfully",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "username": "username"
  }
}
```

#### GET /api/auth/me
```json
Headers: {
  "Authorization": "Bearer jwt_token"
}

Response:
{
  "id": "user_id",
  "email": "user@example.com",
  "username": "username",
  "role": "USER",
  "balance": 0.00,
  "pearlsBalance": 0.00,
  "isActive": true,
  "isVerified": false
}
```

### 🎮 Game Service
Base URL: `/api/games`

#### GET /api/games
```json
Query Parameters:
- status?: "SCHEDULED" | "OPEN" | "IN_PROGRESS" | "COMPLETED"

Response:
[
  {
    "id": "game_id",
    "title": "Bingo Nocturno",
    "description": "Gran premio de la noche",
    "maxPlayers": 500,
    "cardPrice": 5.00,
    "totalPrize": 2500.00,
    "status": "OPEN",
    "scheduledAt": "2024-01-15T20:00:00Z",
    "startedAt": null,
    "endedAt": null,
    "ballsDrawn": [],
    "currentBall": null,
    "winningCards": [],
    "participantCount": 45
  }
]
```

#### GET /api/games/:gameId
```json
Response:
{
  "id": "game_id",
  "title": "Bingo Nocturno",
  "description": "Gran premio de la noche",
  "maxPlayers": 500,
  "cardPrice": 5.00,
  "totalPrize": 2500.00,
  "status": "IN_PROGRESS",
  "scheduledAt": "2024-01-15T20:00:00Z",
  "startedAt": "2024-01-15T20:05:00Z",
  "ballsDrawn": [12, 25, 47, 33, 8],
  "currentBall": 8,
  "winningCards": [],
  "participantCount": 125
}
```

#### POST /api/games/:gameId/join
```json
Headers: {
  "Authorization": "Bearer jwt_token"
}

Response:
{
  "success": true,
  "message": "Successfully joined game",
  "participation": {
    "id": "participation_id",
    "userId": "user_id",
    "gameId": "game_id",
    "joinedAt": "2024-01-15T19:45:00Z"
  }
}
```

### 🎫 Bingo Cards Service
Base URL: `/api/cards`

#### GET /api/cards/user/:userId/game/:gameId
```json
Response:
[
  {
    "id": "card_id",
    "cardNumber": 1,
    "isActive": true,
    "markedNumbers": [12, 25],
    "isWinner": false,
    "winningPattern": null,
    "numbers": [
      {
        "position": 0,
        "column": "B",
        "number": 12,
        "isMarked": true,
        "isFree": false
      }
    ]
  }
]
```

#### POST /api/cards/purchase
```json
Request:
{
  "gameId": "game_id",
  "cardCount": 3
}

Response:
{
  "success": true,
  "message": "Cards purchased successfully",
  "cards": ["card_id_1", "card_id_2", "card_id_3"],
  "totalCost": 15.00,
  "remainingBalance": 485.00
}
```

#### PUT /api/cards/:cardId/mark
```json
Request:
{
  "number": 47
}

Response:
{
  "success": true,
  "cardId": "card_id",
  "markedNumber": 47,
  "totalMarked": 3,
  "isWinner": false
}
```

### 💰 Wallet Service
Base URL: `/api/wallet`

#### GET /api/wallet/balance
```json
Headers: {
  "Authorization": "Bearer jwt_token"
}

Response:
{
  "balance": 500.00,
  "currency": "PEN",
  "dailyLimit": 1000.00,
  "monthlyLimit": 10000.00,
  "isActive": true,
  "isFrozen": false
}
```

#### GET /api/wallet/transactions
```json
Query Parameters:
- page?: number
- limit?: number
- type?: "DEPOSIT" | "WITHDRAWAL" | "TRANSFER" | "GAME_PURCHASE"

Response:
{
  "transactions": [
    {
      "id": "transaction_id",
      "type": "GAME_PURCHASE",
      "amount": 15.00,
      "description": "Purchase of 3 bingo cards",
      "status": "COMPLETED",
      "createdAt": "2024-01-15T19:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

#### POST /api/wallet/transfer
```json
Request:
{
  "toUserId": "recipient_user_id",
  "amount": 50.00,
  "description": "Payment for services"
}

Response:
{
  "success": true,
  "transactionId": "transaction_id",
  "fromBalance": 450.00,
  "commission": 0.50,
  "netAmount": 49.50
}
```

### 💳 Payment Service
Base URL: `/api/payment`

#### POST /api/payment/deposit/create
```json
Request:
{
  "amount": 100.00,
  "paymentMethod": "BCP",
  "proofImage": "base64_image_data"
}

Response:
{
  "success": true,
  "depositRequestId": "deposit_id",
  "referenceCode": "REF123456789",
  "bankAccount": "123-456789-012",
  "accountName": "Bingo La Perla",
  "expiresAt": "2024-01-16T19:30:00Z"
}
```

#### GET /api/payment/deposit/status/:requestId
```json
Response:
{
  "id": "deposit_id",
  "amount": 100.00,
  "status": "PENDING",
  "referenceCode": "REF123456789",
  "paymentMethod": "BCP",
  "createdAt": "2024-01-15T19:30:00Z",
  "expiresAt": "2024-01-16T19:30:00Z"
}
```

#### POST /api/payment/withdrawal/create
```json
Request:
{
  "amount": 200.00,
  "bankCode": "BCP",
  "accountNumber": "123456789",
  "accountType": "SAVINGS",
  "accountHolderName": "John Doe",
  "accountHolderDni": "12345678"
}

Response:
{
  "success": true,
  "withdrawalRequestId": "withdrawal_id",
  "referenceCode": "WIT123456789",
  "netAmount": 195.00,
  "commission": 5.00,
  "estimatedProcessingTime": "24-48 hours"
}
```

### 📊 Analytics Service
Base URL: `/api/analytics`

#### GET /api/analytics/dashboard
```json
Headers: {
  "Authorization": "Bearer jwt_token" // Admin required
}

Response:
{
  "totalUsers": 1250,
  "activeGames": 3,
  "totalRevenue": 25000.00,
  "avgSessionTime": "45 minutes",
  "topGames": [
    {
      "gameId": "game_1",
      "title": "Bingo Nocturno",
      "participants": 150,
      "revenue": 750.00
    }
  ]
}
```

### 🔧 Admin Services
Base URL: `/api/admin`

#### GET /api/admin/payment/deposits
```json
Headers: {
  "Authorization": "Bearer admin_jwt_token"
}

Query Parameters:
- status?: "PENDING" | "APPROVED" | "REJECTED"
- page?: number
- limit?: number

Response:
{
  "deposits": [
    {
      "id": "deposit_id",
      "userId": "user_id",
      "amount": 100.00,
      "paymentMethod": "BCP",
      "referenceCode": "REF123456789",
      "status": "PENDING",
      "proofImage": "image_url",
      "createdAt": "2024-01-15T19:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50
  }
}
```

#### POST /api/admin/payment/deposits/:depositId/approve
```json
Request:
{
  "adminNotes": "Validated with bank statement"
}

Response:
{
  "success": true,
  "message": "Deposit approved successfully",
  "transactionId": "transaction_id",
  "userNewBalance": 600.00
}
```

## 🔌 WebSocket Events

### Client → Server Events

#### join-game-room
```json
{
  "gameId": "game_id"
}
```

#### leave-game-room
```json
{
  "gameId": "game_id"
}
```

#### mark-number
```json
{
  "gameId": "game_id",
  "cardId": "card_id",
  "number": 47
}
```

#### player-claim-bingo
```json
{
  "gameId": "game_id",
  "pattern": "FULL_CARD",
  "userId": "user_id"
}
```

#### admin-call-number
```json
{
  "gameId": "game_id",
  "number": 47
}
```

#### admin-reset-game
```json
{
  "gameId": "game_id"
}
```

### Server → Client Events

#### joined-game-room
```json
{
  "gameId": "game_id",
  "roomSize": 45,
  "timestamp": "2024-01-15T20:00:00Z"
}
```

#### new-ball-drawn
```json
{
  "gameId": "game_id",
  "ball": 47,
  "ballsDrawn": [12, 25, 33, 47],
  "timestamp": "2024-01-15T20:05:30Z"
}
```

#### number-called
```json
{
  "gameId": "game_id",
  "number": 47,
  "timestamp": "2024-01-15T20:05:30Z"
}
```

#### bingo-winner
```json
{
  "gameId": "game_id",
  "cardId": "card_id",
  "pattern": "FULL_CARD",
  "userId": "user_id",
  "timestamp": "2024-01-15T20:15:45Z"
}
```

#### game-status-changed
```json
{
  "gameId": "game_id",
  "status": "IN_PROGRESS",
  "timestamp": "2024-01-15T20:00:00Z"
}
```

#### player-joined
```json
{
  "playerId": "socket_id",
  "timestamp": "2024-01-15T20:00:00Z"
}
```

#### player-left
```json
{
  "playerId": "socket_id",
  "timestamp": "2024-01-15T20:30:00Z"
}
```

## 🛡️ Security Specifications

### Authentication
- **Method**: JSON Web Tokens (JWT)
- **Expiry**: 24 hours for access tokens
- **Refresh**: Implemented via secure HTTP-only cookies
- **Encryption**: bcrypt with salt rounds = 12

### Authorization
- **Roles**: USER, ADMIN
- **Middleware**: Token validation on protected routes
- **Admin Routes**: Additional role-based checks

### Rate Limiting
- **Global**: 100 requests per 15 minutes per IP
- **Auth Routes**: 5 attempts per 15 minutes per IP
- **Payment Routes**: 10 requests per hour per user

### Data Validation
- **Frontend**: Zod schema validation
- **Backend**: Express-validator + Zod
- **Database**: Prisma schema constraints

## 📋 Error Response Format

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "specific error details"
  },
  "timestamp": "2024-01-15T20:00:00Z",
  "path": "/api/endpoint"
}
```

### Common Error Codes
- `UNAUTHORIZED` - Invalid or missing authentication
- `FORBIDDEN` - Insufficient permissions
- `VALIDATION_ERROR` - Invalid input data
- `NOT_FOUND` - Resource not found
- `INSUFFICIENT_BALANCE` - Not enough funds
- `GAME_NOT_AVAILABLE` - Game is full or not accepting players
- `RATE_LIMIT_EXCEEDED` - Too many requests

## 🔄 API Versioning

Currently using implicit v1 via route prefixes:
- `/api/auth/*` - Authentication endpoints
- `/api/games/*` - Game management
- `/api/cards/*` - Bingo card operations
- `/api/wallet/*` - Wallet operations
- `/api/payment/*` - Payment processing
- `/api/analytics/*` - Analytics and reporting
- `/api/admin/*` - Administrative functions

Future versions will use explicit versioning:
- `/api/v1/*` - Current stable version
- `/api/v2/*` - Future version with breaking changes

---

**Documentación API**: Actualizada el ${new Date().toLocaleDateString('es-PE')}
**Versión**: 1.0.0
**Formato**: OpenAPI 3.0 compatible
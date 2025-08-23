# 📱 Arquitectura Frontend - React PWA

## 📋 Índice
- [Visión General](#visión-general)
- [Stack Tecnológico](#stack-tecnológico)
- [Arquitectura de Componentes](#arquitectura-de-componentes)
- [Gestión de Estado](#gestión-de-estado)
- [Routing y Navegación](#routing-y-navegación)
- [PWA Features](#pwa-features)
- [Tiempo Real](#tiempo-real)
- [Internacionalización](#internacionalización)
- [Performance](#performance)
- [Testing](#testing)

---

## 🎯 Visión General

La aplicación frontend es una **Progressive Web App (PWA)** desarrollada en React con TypeScript, diseñada con enfoque **mobile-first** para ofrecer la mejor experiencia posible en dispositivos móviles, mientras mantiene funcionalidad completa en desktop.

### Características Principales
- 📱 **Mobile-First Design** con Tailwind CSS
- ⚡ **PWA Completa** con service workers y cache offline
- 🔄 **Tiempo Real** con WebSockets (Socket.IO)
- 🗂️ **Estado Global** con Redux Toolkit
- 🔐 **Autenticación JWT** con refresh tokens
- 📊 **Dashboard Administrativo** completo
- 🎮 **Interfaz de Juego** inmersiva
- 💎 **Sistema de Pagos** integrado con Openpay

---

## 🛠️ Stack Tecnológico

### Core Technologies
```json
{
  "framework": "React 18.2.0",
  "language": "TypeScript 5.2.2",
  "bundler": "Vite 5.0.8",
  "styling": "Tailwind CSS 3.3.6",
  "state": "Redux Toolkit 2.0.1",
  "routing": "React Router DOM 6.20.1",
  "forms": "React Hook Form 7.48.2",
  "validation": "Zod 3.22.4"
}
```

### UI & Styling
```json
{
  "icons": "Lucide React 0.295.0",
  "animations": "CSS Transitions + Tailwind",
  "responsive": "Mobile-First Breakpoints",
  "theme": "Custom Tailwind Configuration",
  "utilities": "clsx + tailwind-merge"
}
```

### Network & Real-time
```json
{
  "http": "Axios 1.6.2",
  "websockets": "Socket.IO Client 4.8.1",
  "offline": "Service Worker + Cache API",
  "retry": "Custom Retry Queue Logic"
}
```

### Development & Testing
```json
{
  "testing": "Vitest + React Testing Library",
  "e2e": "Playwright (desde proyecto padre)",
  "linting": "ESLint + TypeScript ESLint",
  "formatting": "Prettier",
  "build": "Vite Production Build"
}
```

---

## 🧩 Arquitectura de Componentes

### Estructura de Directorios
```
src/
├── components/           # Componentes reutilizables
│   ├── auth/            # Login, registro, perfil
│   ├── bingo/           # Componentes de juego
│   ├── common/          # Componentes base compartidos
│   ├── payment/         # Pagos y Openpay
│   ├── wallet/          # Billetera y transacciones
│   ├── admin/           # Panel administrativo
│   └── analytics/       # Gráficos y métricas
├── pages/               # Páginas principales de la aplicación
├── hooks/               # Custom hooks reutilizables
├── services/            # Servicios de API y lógica externa
├── store/               # Estado global Redux
├── types/               # Definiciones TypeScript
├── utils/               # Funciones utilitarias
└── contexts/            # React Contexts específicos
```

### Jerarquía de Componentes

#### Componentes Base (Common)
```tsx
// src/components/common/
├── Button.tsx           # Botón reutilizable con variantes
├── Input.tsx            # Input con validación y estados
├── Modal.tsx            # Modal overlay con animaciones
├── LoadingSpinner.tsx   # Indicador de carga
├── ErrorBoundary.tsx    # Manejo de errores React
├── Toast.tsx            # Notificaciones temporales
├── Layout.tsx           # Layout principal de la app
├── Navbar.tsx           # Barra de navegación
├── ProtectedRoute.tsx   # Rutas protegidas por auth
└── PWAInstallPrompt.tsx # Prompt instalación PWA
```

#### Componentes de Bingo
```tsx
// src/components/bingo/
├── BingoCard.tsx        # Cartón de bingo individual
├── BingoCell.tsx        # Celda individual del cartón
├── BallDisplay.tsx      # Mostrar bola actual cantada
├── PatternHighlight.tsx # Resaltado de patrones ganadores
├── GameLobby.tsx        # Sala de espera del juego
├── GameView.tsx         # Vista principal del juego
├── MultiCardView.tsx    # Vista múltiples cartones
├── CardSelector.tsx     # Selector de cartones
└── BingoButton.tsx      # Botón BINGO personalizado
```

#### Componentes de Pago
```tsx
// src/components/payment/
├── OpenpayIntegration.tsx        # Integración principal
├── OpenpayPaymentModal.tsx       # Modal de pago
├── OpenpayPaymentHistory.tsx     # Historial transacciones
└── OpenpayTransactionStatus.tsx  # Estado de transacción
```

### Patrón de Diseño de Componentes

#### Componente Típico
```tsx
// src/components/example/ExampleComponent.tsx
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { cn } from '@/utils/cn';

interface ExampleComponentProps {
  id: string;
  title: string;
  description?: string;
  isActive?: boolean;
  className?: string;
  onAction?: (id: string) => void;
}

export const ExampleComponent: React.FC<ExampleComponentProps> = ({
  id,
  title,
  description,
  isActive = true,
  className,
  onAction
}) => {
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state: RootState) => state.example);
  
  const [localState, setLocalState] = useState(false);

  useEffect(() => {
    // Efectos secundarios
  }, [id]);

  const handleAction = () => {
    if (onAction) {
      onAction(id);
    }
    // Lógica adicional
  };

  if (error) {
    return (
      <div className="text-red-600 p-4 border border-red-300 rounded">
        Error: {error}
      </div>
    );
  }

  return (
    <div className={cn(
      "p-4 border rounded-lg transition-colors",
      isActive ? "border-green-200 bg-green-50" : "border-gray-200",
      className
    )}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          {description && (
            <p className="text-gray-600 text-sm mt-1">{description}</p>
          )}
        </div>
        
        {isLoading ? (
          <LoadingSpinner size="sm" />
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={handleAction}
            disabled={!isActive}
          >
            Acción
          </Button>
        )}
      </div>
    </div>
  );
};
```

### Componentes Responsivos

#### Mobile-First Approach
```tsx
// Ejemplo de componente responsivo
const ResponsiveBingoCard = ({ numbers, marked }) => {
  return (
    <div className="
      grid grid-cols-5 gap-1 
      w-full max-w-xs mx-auto
      sm:max-w-sm sm:gap-2
      md:max-w-md md:gap-3
      lg:max-w-lg
    ">
      {numbers.map((number, index) => (
        <BingoCell
          key={index}
          number={number}
          isMarked={marked.includes(index)}
          className="
            aspect-square 
            text-xs font-bold
            sm:text-sm
            md:text-base
            lg:text-lg
            transition-all duration-200
            hover:scale-105
          "
        />
      ))}
    </div>
  );
};
```

#### Breakpoints Utilizados
```css
/* Configuración Tailwind CSS */
module.exports = {
  theme: {
    screens: {
      'xs': '475px',   /* Móviles pequeños */
      'sm': '640px',   /* Móviles grandes */
      'md': '768px',   /* Tablets */
      'lg': '1024px',  /* Laptops */
      'xl': '1280px',  /* Desktops */
      '2xl': '1536px', /* Pantallas grandes */
    }
  }
}
```

---

## 🗂️ Gestión de Estado

### Redux Toolkit Store

#### Configuración Principal
```typescript
// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import authSlice from './authSlice';
import gameSlice from './gameSlice';
import gamePlaySlice from './gamePlaySlice';
import bingoCardSlice from './bingoCardSlice';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth'] // Solo persistir autenticación
};

const rootReducer = combineReducers({
  auth: authSlice,
  game: gameSlice,
  gamePlay: gamePlaySlice,
  bingoCard: bingoCardSlice
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production'
});

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### Slices Principales

#### Auth Slice
```typescript
// src/store/authSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authApi } from '@/services/authApi';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null
};

// Async Thunks
export const loginAsync = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await authApi.login(credentials);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

export const refreshTokenAsync = createAsyncThunk(
  'auth/refreshToken',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as { auth: AuthState };
      if (!auth.refreshToken) throw new Error('No refresh token');
      
      const response = await authApi.refreshToken(auth.refreshToken);
      return response.data;
    } catch (error: any) {
      return rejectWithValue('Token refresh failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
      })
      .addCase(loginAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Refresh Token
      .addCase(refreshTokenAsync.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
      })
      .addCase(refreshTokenAsync.rejected, (state) => {
        // Auto logout en caso de refresh fallido
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
      });
  }
});

export const { logout, clearError, updateUser } = authSlice.actions;
export default authSlice.reducer;
```

#### Game Play Slice (Tiempo Real)
```typescript
// src/store/gamePlaySlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface GamePlayState {
  currentGameId: string | null;
  gameStatus: 'WAITING' | 'IN_PROGRESS' | 'PAUSED' | 'FINISHED';
  ballsDrawn: number[];
  currentBall: number | null;
  timeElapsed: number;
  playersCount: number;
  isConnected: boolean;
  myCards: string[];
  markedNumbers: Record<string, number[]>; // cardId -> marked positions
}

const initialState: GamePlayState = {
  currentGameId: null,
  gameStatus: 'WAITING',
  ballsDrawn: [],
  currentBall: null,
  timeElapsed: 0,
  playersCount: 0,
  isConnected: false,
  myCards: [],
  markedNumbers: {}
};

const gamePlaySlice = createSlice({
  name: 'gamePlay',
  initialState,
  reducers: {
    joinGame: (state, action: PayloadAction<{ gameId: string; cards: string[] }>) => {
      state.currentGameId = action.payload.gameId;
      state.myCards = action.payload.cards;
      state.markedNumbers = {};
    },
    
    leaveGame: (state) => {
      return initialState; // Reset completo
    },
    
    updateGameStatus: (state, action: PayloadAction<'WAITING' | 'IN_PROGRESS' | 'PAUSED' | 'FINISHED'>) => {
      state.gameStatus = action.payload;
    },
    
    newBallDrawn: (state, action: PayloadAction<{ ball: number; allBalls: number[] }>) => {
      state.currentBall = action.payload.ball;
      state.ballsDrawn = action.payload.allBalls;
    },
    
    markNumber: (state, action: PayloadAction<{ cardId: string; position: number }>) => {
      const { cardId, position } = action.payload;
      if (!state.markedNumbers[cardId]) {
        state.markedNumbers[cardId] = [];
      }
      if (!state.markedNumbers[cardId].includes(position)) {
        state.markedNumbers[cardId].push(position);
      }
    },
    
    socketConnected: (state) => {
      state.isConnected = true;
    },
    
    socketDisconnected: (state) => {
      state.isConnected = false;
    },
    
    updatePlayersCount: (state, action: PayloadAction<number>) => {
      state.playersCount = action.payload;
    }
  }
});

export const {
  joinGame,
  leaveGame,
  updateGameStatus,
  newBallDrawn,
  markNumber,
  socketConnected,
  socketDisconnected,
  updatePlayersCount
} = gamePlaySlice.actions;

export default gamePlaySlice.reducer;
```

---

## 🗺️ Routing y Navegación

### Router Configuration
```tsx
// src/App.tsx
import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import { store, persistor } from '@/store';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

// Lazy loading de páginas
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/RegisterPage'));
const MainMenuPage = lazy(() => import('@/pages/MainMenuPage'));
const GamePage = lazy(() => import('@/pages/GamePage'));
const WalletPage = lazy(() => import('@/pages/WalletPage'));
const AdminPage = lazy(() => import('@/pages/AdminPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={<LoadingSpinner />} persistor={persistor}>
        <BrowserRouter>
          <ErrorBoundary>
            <div className="min-h-screen bg-gray-50">
              <Routes>
                {/* Rutas públicas */}
                <Route 
                  path="/login" 
                  element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <LoginPage />
                    </Suspense>
                  } 
                />
                <Route 
                  path="/register" 
                  element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <RegisterPage />
                    </Suspense>
                  } 
                />
                
                {/* Rutas protegidas */}
                <Route 
                  path="/" 
                  element={
                    <ProtectedRoute>
                      <Suspense fallback={<LoadingSpinner />}>
                        <MainMenuPage />
                      </Suspense>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/game/:gameId?" 
                  element={
                    <ProtectedRoute>
                      <Suspense fallback={<LoadingSpinner />}>
                        <GamePage />
                      </Suspense>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/wallet" 
                  element={
                    <ProtectedRoute>
                      <Suspense fallback={<LoadingSpinner />}>
                        <WalletPage />
                      </Suspense>
                    </ProtectedRoute>
                  } 
                />
                
                {/* Rutas administrativas */}
                <Route 
                  path="/admin" 
                  element={
                    <ProtectedRoute requiredRole="ADMIN">
                      <Suspense fallback={<LoadingSpinner />}>
                        <AdminPage />
                      </Suspense>
                    </ProtectedRoute>
                  } 
                />
                
                {/* 404 */}
                <Route 
                  path="*" 
                  element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <NotFoundPage />
                    </Suspense>
                  } 
                />
              </Routes>
            </div>
          </ErrorBoundary>
        </BrowserRouter>
      </PersistGate>
    </Provider>
  );
}

export default App;
```

### Protected Route Component
```tsx
// src/components/common/ProtectedRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { LoadingSpinner } from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'USER' | 'ADMIN';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const location = useLocation();
  const { isAuthenticated, user, isLoading } = useSelector(
    (state: RootState) => state.auth
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
```

---

## 🔄 PWA Features

### Service Worker Configuration
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'Bingo La Perla',
        short_name: 'Bingo',
        description: 'Juega Bingo de 75 bolas en línea',
        theme_color: '#0f172a',
        background_color: '#1a1a2e',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 5 * 60 // 5 minutes
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ]
});
```

### PWA Install Prompt
```tsx
// src/components/common/PWAInstallPrompt.tsx
import React, { useState, useEffect } from 'react';
import { Button } from './Button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallPrompt: React.FC = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setInstallPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as any);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as any);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;

    await installPrompt.prompt();
    const choiceResult = await installPrompt.userChoice;

    if (choiceResult.outcome === 'accepted') {
      console.log('PWA installed');
    }

    setInstallPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!isVisible || localStorage.getItem('pwa-install-dismissed')) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Instalar Bingo La Perla</h3>
          <p className="text-sm text-gray-600">
            Obtén acceso rápido desde tu pantalla de inicio
          </p>
        </div>
        <div className="flex space-x-2 ml-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
          >
            Más tarde
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleInstall}
          >
            Instalar
          </Button>
        </div>
      </div>
    </div>
  );
};
```

### Offline Functionality
```tsx
// src/hooks/useNetworkStatus.ts
import { useState, useEffect } from 'react';

interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean;
}

export const useNetworkStatus = (): NetworkStatus => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        // Trigger sync of pending actions
        window.dispatchEvent(new CustomEvent('network-restored'));
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  return { isOnline, wasOffline };
};
```

---

## ⚡ Tiempo Real

### Socket.IO Integration

#### Socket Service
```typescript
// src/services/socketService.ts
import { io, Socket } from 'socket.io-client';
import { store } from '@/store';
import { 
  socketConnected, 
  socketDisconnected, 
  newBallDrawn, 
  updatePlayersCount 
} from '@/store/gamePlaySlice';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(token: string): void {
    if (this.socket?.connected) return;

    this.socket = io(process.env.VITE_WS_URL || 'ws://localhost:3001', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ Socket connected');
      store.dispatch(socketConnected());
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      store.dispatch(socketDisconnected());
    });

    // Game events
    this.socket.on('new-ball-drawn', (data) => {
      store.dispatch(newBallDrawn({
        ball: data.ball,
        allBalls: data.ballsDrawn
      }));
    });

    this.socket.on('player-joined', (data) => {
      // Update UI with new player
    });

    this.socket.on('player-left', (data) => {
      // Update UI when player leaves
    });

    this.socket.on('game-status-changed', (data) => {
      store.dispatch(updateGameStatus(data.status));
    });

    // Error handling
    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.handleReconnect();
    });
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        this.socket?.connect();
      }, 1000 * this.reconnectAttempts);
    }
  }

  // Game actions
  joinGameRoom(gameId: string): void {
    this.socket?.emit('join-game-room', gameId);
  }

  leaveGameRoom(gameId: string): void {
    this.socket?.emit('leave-game-room', gameId);
  }

  markNumber(gameId: string, cardId: string, number: number): void {
    this.socket?.emit('mark-number', { gameId, cardId, number });
  }

  claimBingo(gameId: string, cardId: string, pattern: string, userId: string): void {
    this.socket?.emit('bingo-claimed', { gameId, cardId, pattern, userId });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }
}

export const socketService = new SocketService();
```

#### Bingo Socket Hook
```tsx
// src/hooks/useBingoSocket.ts
import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { socketService } from '@/services/socketService';
import { joinGame, markNumber } from '@/store/gamePlaySlice';

export const useBingoSocket = (gameId?: string) => {
  const dispatch = useDispatch();
  const { token } = useSelector((state: RootState) => state.auth);
  const { isConnected, currentGameId } = useSelector((state: RootState) => state.gamePlay);

  useEffect(() => {
    if (token && !isConnected) {
      socketService.connect(token);
    }

    return () => {
      if (currentGameId) {
        socketService.leaveGameRoom(currentGameId);
      }
    };
  }, [token, isConnected, currentGameId]);

  useEffect(() => {
    if (gameId && isConnected && currentGameId !== gameId) {
      socketService.joinGameRoom(gameId);
      dispatch(joinGame({ gameId, cards: [] })); // Cards will be loaded separately
    }
  }, [gameId, isConnected, currentGameId, dispatch]);

  const handleMarkNumber = (cardId: string, position: number, number: number) => {
    if (gameId) {
      dispatch(markNumber({ cardId, position }));
      socketService.markNumber(gameId, cardId, number);
    }
  };

  const handleClaimBingo = (cardId: string, pattern: string, userId: string) => {
    if (gameId) {
      socketService.claimBingo(gameId, cardId, pattern, userId);
    }
  };

  return {
    isConnected,
    handleMarkNumber,
    handleClaimBingo
  };
};
```

---

## 🌍 Internacionalización

### i18n Setup (Preparado)
```typescript
// src/i18n/index.ts (preparado para futuro)
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import es from './locales/es.json';

const resources = {
  en: { translation: en },
  es: { translation: es }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'es', // Español por defecto
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
```

### Locales Structure
```json
// src/i18n/locales/es.json
{
  "common": {
    "loading": "Cargando...",
    "error": "Error",
    "success": "Éxito",
    "cancel": "Cancelar",
    "confirm": "Confirmar",
    "save": "Guardar",
    "delete": "Eliminar",
    "edit": "Editar"
  },
  "auth": {
    "login": "Iniciar Sesión",
    "logout": "Cerrar Sesión",
    "register": "Registrarse",
    "email": "Correo Electrónico",
    "password": "Contraseña",
    "forgotPassword": "¿Olvidaste tu contraseña?"
  },
  "game": {
    "bingo": "¡BINGO!",
    "ballDrawn": "Bola cantada",
    "playersOnline": "Jugadores en línea",
    "gameStarting": "El juego está comenzando...",
    "gameFinished": "Juego terminado",
    "winner": "¡Ganador!"
  },
  "wallet": {
    "balance": "Saldo",
    "deposit": "Depositar",
    "withdraw": "Retirar",
    "transfer": "Transferir",
    "history": "Historial",
    "pearls": "Perlas"
  }
}
```

---

## 🚀 Performance

### Code Splitting
```tsx
// Lazy loading por rutas
const GamePage = lazy(() => 
  import('@/pages/GamePage').then(module => ({
    default: module.GamePage
  }))
);

// Preloading de componentes críticos
const BingoCard = lazy(() => 
  import('@/components/bingo/BingoCard').then(module => {
    // Preload related components
    import('@/components/bingo/BingoCell');
    return { default: module.BingoCard };
  })
);
```

### Bundle Optimization
```typescript
// vite.config.ts - Bundle splitting
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor libraries
          vendor: ['react', 'react-dom'],
          redux: ['@reduxjs/toolkit', 'react-redux'],
          router: ['react-router-dom'],
          
          // UI libraries
          ui: ['lucide-react', 'tailwind-merge', 'clsx'],
          
          // Socket and networking
          socket: ['socket.io-client', 'axios'],
          
          // Forms and validation
          forms: ['react-hook-form', '@hookform/resolvers', 'zod']
        }
      }
    }
  }
});
```

### Performance Hooks
```tsx
// src/hooks/usePerformance.ts
import { useEffect, useRef } from 'react';

export const usePerformance = (componentName: string) => {
  const startTime = useRef(performance.now());

  useEffect(() => {
    const endTime = performance.now();
    const renderTime = endTime - startTime.current;
    
    if (renderTime > 16) { // Más de 16ms (60fps)
      console.warn(`Slow render detected in ${componentName}: ${renderTime}ms`);
    }
  });

  useEffect(() => {
    startTime.current = performance.now();
  });
};

// Uso en componentes
const ExpensiveComponent = () => {
  usePerformance('ExpensiveComponent');
  
  // ... resto del componente
};
```

### Memoization Strategies
```tsx
// Memorización de componentes costosos
const BingoCard = React.memo(({ numbers, marked, onNumberClick }) => {
  // Solo re-renderiza si numbers o marked cambian
  return (
    <div className="grid grid-cols-5 gap-1">
      {numbers.map((number, index) => (
        <BingoCell
          key={`${number}-${index}`}
          number={number}
          isMarked={marked.includes(index)}
          onClick={() => onNumberClick(index, number)}
        />
      ))}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function
  return (
    JSON.stringify(prevProps.numbers) === JSON.stringify(nextProps.numbers) &&
    JSON.stringify(prevProps.marked) === JSON.stringify(nextProps.marked)
  );
});

// Memorización de callbacks
const GameView = () => {
  const handleNumberClick = useMemo(
    () => throttle((index: number, number: number) => {
      // Handle number click with throttling
      dispatch(markNumber({ cardId, position: index }));
    }, 100),
    [dispatch, cardId]
  );
  
  return <BingoCard numbers={numbers} marked={marked} onNumberClick={handleNumberClick} />;
};
```

---

## 🧪 Testing

### Component Testing
```tsx
// src/components/__tests__/BingoCard.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BingoCard } from '../bingo/BingoCard';
import gamePlayReducer from '@/store/gamePlaySlice';

const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      gamePlay: gamePlayReducer
    },
    preloadedState: initialState
  });
};

const renderWithProvider = (component: React.ReactElement, initialState = {}) => {
  const store = createTestStore(initialState);
  return render(
    <Provider store={store}>
      {component}
    </Provider>
  );
};

describe('BingoCard', () => {
  const mockNumbers = [
    [1, 16, 31, 46, 61],
    [2, 17, 32, 47, 62],
    [3, 18, null, 48, 63], // Free space
    [4, 19, 34, 49, 64],
    [5, 20, 35, 50, 65]
  ].flat();

  it('renders bingo card with correct numbers', () => {
    renderWithProvider(
      <BingoCard 
        cardId="test-card"
        numbers={mockNumbers}
        markedPositions={[]}
        onNumberClick={jest.fn()}
      />
    );

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('FREE')).toBeInTheDocument();
    expect(screen.getByText('65')).toBeInTheDocument();
  });

  it('marks numbers when clicked', () => {
    const mockOnNumberClick = jest.fn();
    
    renderWithProvider(
      <BingoCard 
        cardId="test-card"
        numbers={mockNumbers}
        markedPositions={[]}
        onNumberClick={mockOnNumberClick}
      />
    );

    fireEvent.click(screen.getByText('1'));
    
    expect(mockOnNumberClick).toHaveBeenCalledWith(0, 1);
  });

  it('highlights marked numbers', () => {
    renderWithProvider(
      <BingoCard 
        cardId="test-card"
        numbers={mockNumbers}
        markedPositions={[0, 1, 2]} // First three positions
        onNumberClick={jest.fn()}
      />
    );

    const firstCell = screen.getByText('1').parentElement;
    expect(firstCell).toHaveClass('bg-green-200'); // Marked style
  });
});
```

### Custom Hook Testing
```tsx
// src/hooks/__tests__/useBingoSocket.test.ts
import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useBingoSocket } from '../useBingoSocket';
import { socketService } from '@/services/socketService';

// Mock socket service
jest.mock('@/services/socketService');
const mockSocketService = socketService as jest.Mocked<typeof socketService>;

describe('useBingoSocket', () => {
  const createWrapper = (initialState = {}) => {
    const store = configureStore({
      reducer: {
        auth: (state = { token: 'test-token' }) => state,
        gamePlay: (state = { isConnected: false, currentGameId: null }, action) => {
          switch (action.type) {
            case 'gamePlay/socketConnected':
              return { ...state, isConnected: true };
            default:
              return state;
          }
        }
      },
      preloadedState: initialState
    });

    return ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('connects to socket when token is available', () => {
    renderHook(() => useBingoSocket('game-123'), {
      wrapper: createWrapper()
    });

    expect(mockSocketService.connect).toHaveBeenCalledWith('test-token');
  });

  it('joins game room when gameId is provided', () => {
    renderHook(() => useBingoSocket('game-123'), {
      wrapper: createWrapper({
        gamePlay: { isConnected: true, currentGameId: null }
      })
    });

    expect(mockSocketService.joinGameRoom).toHaveBeenCalledWith('game-123');
  });

  it('handles number marking', () => {
    const { result } = renderHook(() => useBingoSocket('game-123'), {
      wrapper: createWrapper({
        gamePlay: { isConnected: true, currentGameId: 'game-123' }
      })
    });

    act(() => {
      result.current.handleMarkNumber('card-1', 5, 25);
    });

    expect(mockSocketService.markNumber).toHaveBeenCalledWith('game-123', 'card-1', 25);
  });
});
```

### Integration Testing
```tsx
// src/__tests__/integration/GameFlow.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { setupServer } from 'msw/node';
import { rest } from 'msw';

import App from '@/App';
import { store } from '@/store';

// Mock server for API calls
const server = setupServer(
  rest.post('/api/auth/login', (req, res, ctx) => {
    return res(ctx.json({
      user: { id: '1', email: 'test@example.com', role: 'USER' },
      token: 'test-token',
      refreshToken: 'test-refresh-token'
    }));
  }),
  
  rest.get('/api/games', (req, res, ctx) => {
    return res(ctx.json({
      success: true,
      data: [
        {
          id: 'game-1',
          title: 'Bingo de Prueba',
          status: 'OPEN',
          cardPrice: 5.00,
          scheduledAt: new Date().toISOString()
        }
      ]
    }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Game Flow Integration', () => {
  const renderApp = (initialRoute = '/') => {
    return render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[initialRoute]}>
          <App />
        </MemoryRouter>
      </Provider>
    );
  };

  it('completes full login and game join flow', async () => {
    renderApp('/login');

    // Login
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    });
    fireEvent.click(screen.getByText(/iniciar sesión/i));

    // Wait for redirect to main menu
    await waitFor(() => {
      expect(screen.getByText(/menú principal/i)).toBeInTheDocument();
    });

    // Navigate to games
    fireEvent.click(screen.getByText(/juegos/i));

    // Wait for games to load and select one
    await waitFor(() => {
      expect(screen.getByText('Bingo de Prueba')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Bingo de Prueba'));

    // Should navigate to game page
    await waitFor(() => {
      expect(screen.getByText(/sala de juego/i)).toBeInTheDocument();
    });
  });
});
```

---

*Documentación completa del frontend con todas las características implementadas y patrones utilizados.*
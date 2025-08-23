# 🚀 Guía de Desarrollo - Bingo La Perla

## 📋 Índice
- [Setup del Entorno](#setup-del-entorno)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Base de Datos y Migraciones](#base-de-datos-y-migraciones)
- [Desarrollo Backend](#desarrollo-backend)
- [Desarrollo Frontend](#desarrollo-frontend)
- [Testing y Quality Assurance](#testing-y-quality-assurance)
- [Debugging y Troubleshooting](#debugging-y-troubleshooting)
- [Deployment y DevOps](#deployment-y-devops)
- [Best Practices](#best-practices)

---

## ⚙️ Setup del Entorno

### Prerrequisitos
```bash
# Versiones requeridas
Node.js >= 18.0.0
npm >= 9.0.0
Git >= 2.30.0

# Verificar instalación
node --version
npm --version
git --version
```

### Instalación Inicial

#### 1. Clonar el Repositorio
```bash
git clone <repository-url>
cd Bingo-deploy
```

#### 2. Instalar Dependencias
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install

# Desde la raíz (ambos a la vez)
cd ..
npm install
```

#### 3. Configuración de Variables de Entorno

##### Backend (.env)
```env
# Base de datos
DATABASE_URL="file:./dev.db"
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secure-jwt-secret-key-change-in-production"
JWT_EXPIRES_IN="24h"
JWT_REFRESH_SECRET="your-super-secure-refresh-secret-key"
JWT_REFRESH_EXPIRES_IN="7d"

# Servidor
NODE_ENV="development"
PORT=3001
FRONTEND_URL="http://localhost:5173"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutos
RATE_LIMIT_MAX_REQUESTS=100

# Openpay (Development)
OPENPAY_MOCK_MODE=true
OPENPAY_PRODUCTION=false
OPENPAY_MERCHANT_ID="mock_merchant_12345"
OPENPAY_PRIVATE_KEY="sk_mock_private_key_development_12345"
OPENPAY_PUBLIC_KEY="pk_mock_public_key_development_12345"
OPENPAY_MOCK_DELAY_MS=1000
OPENPAY_MOCK_SUCCESS_RATE=0.95
```

##### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
VITE_OPENPAY_MERCHANT_ID=mock_merchant_12345
VITE_OPENPAY_PUBLIC_KEY=pk_mock_public_key_development_12345
```

### Inicialización de Base de Datos

```bash
cd backend

# Generar Prisma client
npm run prisma:generate

# Ejecutar migraciones
npm run prisma:migrate

# Poblar datos iniciales
npm run prisma:seed

# Verificar con Prisma Studio (opcional)
npm run prisma:studio
```

### Verificación del Setup

```bash
# Backend
cd backend
npm run dev          # Debe iniciar en puerto 3001
npm run health       # Debe retornar status OK

# Frontend (nueva terminal)
cd frontend
npm run dev          # Debe iniciar en puerto 5173
```

---

## 📁 Estructura del Proyecto

### Organización General
```
Bingo-deploy/
├── backend/                 # Servidor Node.js/Express
│   ├── src/
│   │   ├── config/         # Configuraciones
│   │   ├── controllers/    # Controladores API
│   │   ├── services/       # Lógica de negocio
│   │   ├── middleware/     # Middleware personalizado
│   │   ├── routes/         # Definición de rutas
│   │   ├── types/          # Tipos TypeScript
│   │   ├── utils/          # Utilidades
│   │   └── __tests__/      # Tests
│   ├── prisma/             # Schema y migraciones
│   └── docs/               # Documentación
├── frontend/               # Aplicación React PWA
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── pages/          # Páginas principales
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # Servicios API
│   │   ├── store/          # Estado Redux
│   │   ├── types/          # Tipos TypeScript
│   │   └── utils/          # Utilidades
│   └── public/             # Assets estáticos
└── docs/                   # Documentación general
```

### Convenciones de Naming

#### Archivos y Directorios
- **camelCase**: Para archivos TypeScript/JavaScript
- **PascalCase**: Para componentes React
- **kebab-case**: Para assets y archivos de configuración
- **UPPER_CASE**: Para constantes y variables de entorno

#### Código
```typescript
// Interfaces y Types - PascalCase
interface UserProfile { }
type PaymentMethod = string;

// Classes - PascalCase
class OpenpayService { }

// Functions y Variables - camelCase
const getUserProfile = () => { };
const isLoggedIn = true;

// Constants - UPPER_CASE
const API_BASE_URL = 'https://api.example.com';
const MAX_RETRY_ATTEMPTS = 3;

// Enums - PascalCase
enum GameStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS'
}
```

---

## 🗃️ Base de Datos y Migraciones

### Trabajar con Prisma

#### Comandos Esenciales
```bash
# Generar cliente después de cambios en schema
npm run prisma:generate

# Crear nueva migración
npm run prisma:migrate -- --name "descripcion_cambio"

# Aplicar migraciones en producción
npm run prisma:migrate:prod

# Resetear base de datos (CUIDADO - borra todo)
npm run prisma:reset

# Visualizar datos
npm run prisma:studio
```

#### Crear Nueva Migración
```bash
# 1. Modificar schema.prisma
# 2. Crear migración
npx prisma migrate dev --name "add_user_preferences"

# 3. Verificar migración generada
ls prisma/migrations/
```

#### Ejemplo de Modificación de Schema
```prisma
// Agregar nueva tabla
model UserPreferences {
  id                    String   @id @default(cuid())
  userId                String   @unique
  emailNotifications    Boolean  @default(true)
  pushNotifications     Boolean  @default(true)
  marketingConsent      Boolean  @default(false)
  preferredLanguage     String   @default("es")
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("user_preferences")
}

// Actualizar modelo User
model User {
  // ... campos existentes
  preferences UserPreferences?
}
```

### Seeding de Datos

#### Modificar seed.ts
```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Crear usuario admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@bingo.com' },
    update: {},
    create: {
      email: 'admin@bingo.com',
      username: 'admin',
      password: adminPassword,
      role: 'ADMIN',
      fullName: 'Administrador del Sistema',
      isActive: true,
      isVerified: true,
      pearlsBalance: 1000
    }
  });

  // Crear configuración bancaria
  await prisma.bankConfiguration.createMany({
    data: [
      {
        bankCode: 'BCP',
        bankName: 'Banco de Crédito del Perú',
        accountNumber: '123-456-789-012',
        accountType: 'CHECKING',
        accountHolderName: 'Bingo La Perla SAC',
        cci: '00212312345678901234',
        isActive: true,
        minDeposit: 10.00,
        maxDeposit: 1000.00
      }
      // ... otros bancos
    ],
    skipDuplicates: true
  });

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

## 🖥️ Desarrollo Backend

### Estructura de un Controlador

```typescript
// src/controllers/exampleController.ts
import { Request, Response } from 'express';
import { z } from 'zod';
import { HTTP_STATUS } from '@/utils/constants';
import { logger } from '@/utils/structuredLogger';
import { ExampleService } from '@/services/exampleService';
import { AuthRequest } from '@/types/auth';

// Schema de validación
const createExampleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  isActive: z.boolean().default(true)
});

export class ExampleController {
  private exampleService: ExampleService;

  constructor() {
    this.exampleService = new ExampleService();
  }

  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Validar entrada
      const validation = createExampleSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: 'Invalid data',
          details: validation.error.errors
        });
        return;
      }

      const { name, description, isActive } = validation.data;
      const userId = req.user.userId;

      // Log de operación
      logger.info('Creating example', { userId, name });

      // Llamar al servicio
      const example = await this.exampleService.create({
        userId,
        name,
        description,
        isActive
      });

      // Respuesta exitosa
      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data: example,
        message: 'Example created successfully'
      });

      // Log de éxito
      logger.info('Example created', { userId, exampleId: example.id });

    } catch (error: any) {
      // Log de error
      logger.error('Error creating example', error, {
        userId: req.user?.userId,
        body: req.body
      });

      // Respuesta de error
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to create example',
        message: 'Please try again later'
      });
    }
  }
}
```

### Estructura de un Servicio

```typescript
// src/services/exampleService.ts
import { prisma } from '@/config/database';
import { logger } from '@/utils/structuredLogger';

interface CreateExampleData {
  userId: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export class ExampleService {
  async create(data: CreateExampleData) {
    try {
      // Validaciones de negocio
      const existingExample = await prisma.example.findFirst({
        where: { 
          userId: data.userId,
          name: data.name 
        }
      });

      if (existingExample) {
        throw new Error('Example with this name already exists');
      }

      // Crear registro
      const example = await prisma.example.create({
        data: {
          userId: data.userId,
          name: data.name,
          description: data.description,
          isActive: data.isActive
        }
      });

      return example;

    } catch (error) {
      logger.error('Service error creating example', error as Error);
      throw error;
    }
  }

  async findByUser(userId: string) {
    return await prisma.example.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }
}
```

### Middleware Personalizado

```typescript
// src/middleware/validation.ts
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { HTTP_STATUS } from '@/utils/constants';

export const validateRequest = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validation = schema.safeParse({
        body: req.body,
        query: req.query,
        params: req.params
      });

      if (!validation.success) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: 'Validation failed',
          details: validation.error.errors
        });
      }

      // Reemplazar req con datos validados
      req.body = validation.data.body || req.body;
      req.query = validation.data.query || req.query;
      req.params = validation.data.params || req.params;

      next();
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Validation error'
      });
    }
  };
};
```

### Testing del Backend

#### Test de Controlador
```typescript
// src/__tests__/controllers/exampleController.test.ts
import request from 'supertest';
import { createTestApp, createTestUser, cleanupTestData } from '../helpers/testSetup';

describe('ExampleController', () => {
  let app: any;
  let authToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    const user = await createTestUser();
    authToken = createAuthToken(user);
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('POST /api/examples', () => {
    it('should create example successfully', async () => {
      const exampleData = {
        name: 'Test Example',
        description: 'Test description',
        isActive: true
      };

      const response = await request(app)
        .post('/api/examples')
        .set('Authorization', `Bearer ${authToken}`)
        .send(exampleData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        name: exampleData.name,
        description: exampleData.description,
        isActive: exampleData.isActive
      });
    });

    it('should fail with invalid data', async () => {
      const response = await request(app)
        .post('/api/examples')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: '' }); // Nombre vacío

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
```

---

## 📱 Desarrollo Frontend

### Estructura de un Componente

```tsx
// src/components/example/ExampleCard.tsx
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { updateExample } from '@/store/exampleSlice';
import { Button } from '@/components/common/Button';

interface ExampleCardProps {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const ExampleCard: React.FC<ExampleCardProps> = ({
  id,
  name,
  description,
  isActive,
  onEdit,
  onDelete
}) => {
  const dispatch = useDispatch();
  const { isLoading } = useSelector((state: RootState) => state.example);

  const handleToggleActive = async () => {
    try {
      await dispatch(updateExample({ 
        id, 
        updates: { isActive: !isActive } 
      })).unwrap();
    } catch (error) {
      console.error('Failed to update example:', error);
    }
  };

  return (
    <div className={`
      border rounded-lg p-4 transition-colors
      ${isActive ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}
    `}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-gray-900">{name}</h3>
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit?.(id)}
            disabled={isLoading}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete?.(id)}
            disabled={isLoading}
            className="text-red-600 hover:text-red-800"
          >
            Delete
          </Button>
        </div>
      </div>
      
      {description && (
        <p className="text-gray-600 text-sm mb-3">{description}</p>
      )}
      
      <div className="flex justify-between items-center">
        <span className={`
          px-2 py-1 rounded-full text-xs font-medium
          ${isActive 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
          }
        `}>
          {isActive ? 'Active' : 'Inactive'}
        </span>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleToggleActive}
          disabled={isLoading}
        >
          {isActive ? 'Deactivate' : 'Activate'}
        </Button>
      </div>
    </div>
  );
};
```

### Custom Hook

```tsx
// src/hooks/useExample.ts
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { fetchExamples, createExample, updateExample, deleteExample } from '@/store/exampleSlice';
import type { Example } from '@/types';

export const useExample = () => {
  const dispatch = useDispatch();
  const { examples, isLoading, error } = useSelector(
    (state: RootState) => state.example
  );

  const [selectedExample, setSelectedExample] = useState<Example | null>(null);

  useEffect(() => {
    dispatch(fetchExamples());
  }, [dispatch]);

  const handleCreate = async (data: Omit<Example, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const result = await dispatch(createExample(data)).unwrap();
      return { success: true, data: result };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const handleUpdate = async (id: string, updates: Partial<Example>) => {
    try {
      const result = await dispatch(updateExample({ id, updates })).unwrap();
      return { success: true, data: result };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await dispatch(deleteExample(id)).unwrap();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  return {
    examples,
    isLoading,
    error,
    selectedExample,
    setSelectedExample,
    handleCreate,
    handleUpdate,
    handleDelete
  };
};
```

### Redux Slice

```typescript
// src/store/exampleSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { exampleApi } from '@/services/exampleApi';
import type { Example } from '@/types';

interface ExampleState {
  examples: Example[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ExampleState = {
  examples: [],
  isLoading: false,
  error: null
};

// Async thunks
export const fetchExamples = createAsyncThunk(
  'example/fetchExamples',
  async (_, { rejectWithValue }) => {
    try {
      const response = await exampleApi.getAll();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch examples');
    }
  }
);

export const createExample = createAsyncThunk(
  'example/createExample',
  async (data: Omit<Example, 'id' | 'createdAt' | 'updatedAt'>, { rejectWithValue }) => {
    try {
      const response = await exampleApi.create(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create example');
    }
  }
);

export const updateExample = createAsyncThunk(
  'example/updateExample',
  async ({ id, updates }: { id: string; updates: Partial<Example> }, { rejectWithValue }) => {
    try {
      const response = await exampleApi.update(id, updates);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update example');
    }
  }
);

export const deleteExample = createAsyncThunk(
  'example/deleteExample',
  async (id: string, { rejectWithValue }) => {
    try {
      await exampleApi.delete(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete example');
    }
  }
);

// Slice
const exampleSlice = createSlice({
  name: 'example',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setExamples: (state, action: PayloadAction<Example[]>) => {
      state.examples = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch examples
      .addCase(fetchExamples.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchExamples.fulfilled, (state, action) => {
        state.isLoading = false;
        state.examples = action.payload;
      })
      .addCase(fetchExamples.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create example
      .addCase(createExample.fulfilled, (state, action) => {
        state.examples.unshift(action.payload);
      })
      // Update example
      .addCase(updateExample.fulfilled, (state, action) => {
        const index = state.examples.findIndex(ex => ex.id === action.payload.id);
        if (index !== -1) {
          state.examples[index] = action.payload;
        }
      })
      // Delete example
      .addCase(deleteExample.fulfilled, (state, action) => {
        state.examples = state.examples.filter(ex => ex.id !== action.payload);
      });
  }
});

export const { clearError, setExamples } = exampleSlice.actions;
export default exampleSlice.reducer;
```

---

## 🧪 Testing y Quality Assurance

### Testing Backend

#### Tests Unitarios
```typescript
// src/__tests__/services/exampleService.test.ts
import { ExampleService } from '@/services/exampleService';
import { prisma } from '@/config/database';

// Mock Prisma
jest.mock('@/config/database', () => ({
  prisma: {
    example: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    }
  }
}));

describe('ExampleService', () => {
  let exampleService: ExampleService;
  const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

  beforeEach(() => {
    exampleService = new ExampleService();
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create example successfully', async () => {
      const mockExample = {
        id: '1',
        userId: 'user1',
        name: 'Test Example',
        description: 'Test description',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockedPrisma.example.findFirst.mockResolvedValue(null);
      mockedPrisma.example.create.mockResolvedValue(mockExample);

      const result = await exampleService.create({
        userId: 'user1',
        name: 'Test Example',
        description: 'Test description',
        isActive: true
      });

      expect(result).toEqual(mockExample);
      expect(mockedPrisma.example.create).toHaveBeenCalledWith({
        data: {
          userId: 'user1',
          name: 'Test Example',
          description: 'Test description',
          isActive: true
        }
      });
    });

    it('should throw error if example already exists', async () => {
      mockedPrisma.example.findFirst.mockResolvedValue({
        id: '1',
        userId: 'user1',
        name: 'Test Example'
      } as any);

      await expect(
        exampleService.create({
          userId: 'user1',
          name: 'Test Example',
          isActive: true
        })
      ).rejects.toThrow('Example with this name already exists');
    });
  });
});
```

#### Tests de Integración
```typescript
// src/__tests__/integration/exampleEndpoints.test.ts
import request from 'supertest';
import { createTestApp, createTestUser, createAuthToken, cleanupTestData } from '../helpers/testSetup';

describe('Example Endpoints Integration', () => {
  let app: any;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    app = await createTestApp();
    const user = await createTestUser();
    userId = user.id;
    authToken = createAuthToken(user);
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('Example CRUD Operations', () => {
    let exampleId: string;

    it('should create example', async () => {
      const response = await request(app)
        .post('/api/examples')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Integration Test Example',
          description: 'Created in integration test',
          isActive: true
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Integration Test Example');
      
      exampleId = response.body.data.id;
    });

    it('should get examples', async () => {
      const response = await request(app)
        .get('/api/examples')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should update example', async () => {
      const response = await request(app)
        .put(`/api/examples/${exampleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Example Name',
          isActive: false
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Example Name');
      expect(response.body.data.isActive).toBe(false);
    });

    it('should delete example', async () => {
      const response = await request(app)
        .delete(`/api/examples/${exampleId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
```

### Testing Frontend

#### Tests de Componentes
```tsx
// src/components/__tests__/ExampleCard.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ExampleCard } from '../example/ExampleCard';
import exampleReducer from '@/store/exampleSlice';

const mockStore = configureStore({
  reducer: {
    example: exampleReducer
  }
});

const MockedExampleCard = (props: any) => (
  <Provider store={mockStore}>
    <ExampleCard {...props} />
  </Provider>
);

describe('ExampleCard', () => {
  const defaultProps = {
    id: '1',
    name: 'Test Example',
    description: 'Test description',
    isActive: true
  };

  it('renders example information correctly', () => {
    render(<MockedExampleCard {...defaultProps} />);

    expect(screen.getByText('Test Example')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = jest.fn();
    render(<MockedExampleCard {...defaultProps} onEdit={onEdit} />);

    fireEvent.click(screen.getByText('Edit'));
    expect(onEdit).toHaveBeenCalledWith('1');
  });

  it('calls onDelete when delete button is clicked', () => {
    const onDelete = jest.fn();
    render(<MockedExampleCard {...defaultProps} onDelete={onDelete} />);

    fireEvent.click(screen.getByText('Delete'));
    expect(onDelete).toHaveBeenCalledWith('1');
  });

  it('shows inactive status correctly', () => {
    render(<MockedExampleCard {...defaultProps} isActive={false} />);
    
    expect(screen.getByText('Inactive')).toBeInTheDocument();
    expect(screen.getByText('Activate')).toBeInTheDocument();
  });
});
```

### Tests E2E con Playwright

```typescript
// e2e/tests/example-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Example Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'admin@bingo.com');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    
    // Wait for redirect
    await page.waitForURL('/dashboard');
  });

  test('should create, edit and delete example', async ({ page }) => {
    // Navigate to examples
    await page.click('[data-testid="examples-nav"]');
    await page.waitForURL('/examples');

    // Create example
    await page.click('[data-testid="create-example-button"]');
    await page.fill('[data-testid="example-name-input"]', 'E2E Test Example');
    await page.fill('[data-testid="example-description-input"]', 'Created in E2E test');
    await page.click('[data-testid="save-example-button"]');

    // Verify creation
    await expect(page.locator('text=E2E Test Example')).toBeVisible();
    await expect(page.locator('text=Created in E2E test')).toBeVisible();

    // Edit example
    await page.click('[data-testid="edit-example-button"]');
    await page.fill('[data-testid="example-name-input"]', 'E2E Test Example - Updated');
    await page.click('[data-testid="save-example-button"]');

    // Verify update
    await expect(page.locator('text=E2E Test Example - Updated')).toBeVisible();

    // Delete example
    await page.click('[data-testid="delete-example-button"]');
    await page.click('[data-testid="confirm-delete-button"]');

    // Verify deletion
    await expect(page.locator('text=E2E Test Example - Updated')).not.toBeVisible();
  });
});
```

---

## 🔧 Debugging y Troubleshooting

### Debugging Backend

#### Logs Estructurados
```typescript
// Usar el sistema de logs estructurados
import { logger } from '@/utils/structuredLogger';

// Log de información
logger.info('User action performed', {
  userId: user.id,
  action: 'CREATE_EXAMPLE',
  metadata: { exampleName: 'Test' }
});

// Log de error con contexto
logger.error('Database operation failed', error, {
  operation: 'CREATE_EXAMPLE',
  userId: user.id,
  attemptCount: 3
});

// Log de negocio
logger.business('Payment processed', {
  userId: payment.userId,
  amount: payment.amount,
  method: payment.method
}, {
  transactionId: payment.id
});
```

#### Debug de Base de Datos
```typescript
// Habilitar logs de Prisma en development
// En .env
DATABASE_URL="file:./dev.db?connection_limit=1&pool_timeout=20"
PRISMA_LOG_LEVEL="info,warn,error"

// En codigo
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error']
    : ['warn', 'error']
});
```

#### Debugging de WebSockets
```typescript
// src/services/socketDebugService.ts
export class SocketDebugService {
  static debugConnection(socket: Socket) {
    console.log(`🔌 Socket connected: ${socket.id}`);
    console.log(`👤 User: ${socket.handshake.auth?.userId}`);
    console.log(`🌐 IP: ${socket.handshake.address}`);
    
    socket.onAny((event, ...args) => {
      console.log(`📨 Socket event: ${event}`, args);
    });
    
    socket.on('disconnect', (reason) => {
      console.log(`❌ Socket disconnected: ${socket.id} - ${reason}`);
    });
  }
}
```

### Debugging Frontend

#### Redux DevTools
```typescript
// store/index.ts
export const store = configureStore({
  reducer: rootReducer,
  devTools: process.env.NODE_ENV !== 'production',
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST']
      }
    }).concat(/* middlewares */)
});
```

#### Debug de APIs
```typescript
// services/httpClient.ts
const httpClient = axios.create({
  baseURL: process.env.VITE_API_BASE_URL
});

if (process.env.NODE_ENV === 'development') {
  httpClient.interceptors.request.use((config) => {
    console.log('🔄 API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      data: config.data,
      headers: config.headers
    });
    return config;
  });

  httpClient.interceptors.response.use(
    (response) => {
      console.log('✅ API Response:', {
        status: response.status,
        url: response.config.url,
        data: response.data
      });
      return response;
    },
    (error) => {
      console.error('❌ API Error:', {
        status: error.response?.status,
        url: error.config?.url,
        message: error.message,
        data: error.response?.data
      });
      return Promise.reject(error);
    }
  );
}
```

### Herramientas de Debugging

#### VS Code Configuration
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Backend",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/backend/src/server.ts",
      "env": {
        "NODE_ENV": "development"
      },
      "runtimeArgs": ["-r", "ts-node/register", "-r", "tsconfig-paths/register"],
      "sourceMaps": true,
      "cwd": "${workspaceFolder}/backend",
      "console": "integratedTerminal"
    }
  ]
}
```

#### Docker Debugging
```yaml
# docker-compose.debug.yml
version: '3.8'
services:
  backend-debug:
    build:
      context: ./backend
      dockerfile: Dockerfile.debug
    ports:
      - "3001:3001"
      - "9229:9229"  # Node.js debug port
    volumes:
      - ./backend/src:/app/src
    environment:
      - NODE_ENV=development
      - DEBUG=*
    command: ["npm", "run", "debug"]
```

---

## 🚀 Deployment y DevOps

### Preparación para Producción

#### Variables de Entorno de Producción
```env
# .env.production
NODE_ENV=production
PORT=3001

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/bingo_production"
REDIS_URL="redis://redis:6379"

# JWT (usar valores seguros reales)
JWT_SECRET="super-secure-jwt-secret-32-chars-minimum"
JWT_REFRESH_SECRET="super-secure-refresh-secret-32-chars"

# Openpay Producción
OPENPAY_MOCK_MODE=false
OPENPAY_PRODUCTION=true
OPENPAY_MERCHANT_ID="real_merchant_id"
OPENPAY_PRIVATE_KEY="sk_real_private_key"
OPENPAY_PUBLIC_KEY="pk_real_public_key"

# URLs
FRONTEND_URL="https://bingo.tudominio.com"
```

#### Build de Producción
```bash
# Backend
cd backend
npm run build
npm run prisma:generate
NODE_ENV=production npm run prisma:migrate:prod

# Frontend
cd frontend
npm run build

# Verificar builds
ls -la backend/dist/
ls -la frontend/dist/
```

### Docker Configuration

#### Backend Dockerfile
```dockerfile
# backend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build
RUN npx prisma generate

FROM node:18-alpine AS production

WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

EXPOSE 3001

CMD ["npm", "run", "production:start"]
```

#### Frontend Dockerfile
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine AS production

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### Docker Compose
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: bingo_production
      POSTGRES_USER: bingo_user
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://bingo_user:${POSTGRES_PASSWORD}@postgres:5432/bingo_production
      - REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### CI/CD Pipeline

#### GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install backend dependencies
        working-directory: ./backend
        run: npm ci
      
      - name: Install frontend dependencies
        working-directory: ./frontend
        run: npm ci
      
      - name: Run backend tests
        working-directory: ./backend
        run: npm test
      
      - name: Run frontend tests
        working-directory: ./frontend
        run: npm test
      
      - name: Run E2E tests
        run: npx playwright test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to server
        uses: appleboy/ssh-action@v0.1.4
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /opt/bingo-deploy
            git pull origin main
            docker-compose -f docker-compose.prod.yml down
            docker-compose -f docker-compose.prod.yml up -d --build
```

---

## 📋 Best Practices

### Código Backend

1. **Validación en múltiples capas**
   - Cliente (frontend)
   - Middleware de validación
   - Capa de servicio
   - Base de datos (constraints)

2. **Manejo de errores centralizado**
   ```typescript
   // middleware/errorHandler.ts
   export const globalErrorHandler = (
     error: Error, 
     req: Request, 
     res: Response, 
     next: NextFunction
   ) => {
     logger.error('Unhandled error', error, {
       url: req.url,
       method: req.method,
       userAgent: req.get('User-Agent')
     });

     if (error instanceof ValidationError) {
       return res.status(400).json({
         success: false,
         error: 'Validation failed',
         details: error.details
       });
     }

     res.status(500).json({
       success: false,
       error: 'Internal server error'
     });
   };
   ```

3. **Logging estructurado**
   - Usar contexto en todos los logs
   - Separar logs por tipo (info, error, business)
   - Incluir IDs de correlación

### Código Frontend

1. **Componentes pequeños y reutilizables**
   ```tsx
   // ✅ Bueno - componente enfocado
   const UserAvatar = ({ user, size = 'md' }) => { /* ... */ };

   // ❌ Malo - componente demasiado complejo
   const UserProfilePage = () => { 
     // 500+ líneas de código
   };
   ```

2. **Custom hooks para lógica reutilizable**
   ```tsx
   // ✅ Bueno - lógica encapsulada
   const useUserProfile = (userId) => {
     // Lógica de manejo de estado
   };

   // ❌ Malo - lógica duplicada en componentes
   ```

3. **Estado global mínimo**
   - Solo datos compartidos entre componentes
   - Estados locales para UI
   - Normalizar datos en store

### Base de Datos

1. **Índices apropiados**
   ```prisma
   model User {
     id    String @id @default(cuid())
     email String @unique
     
     @@index([email])        // Para búsquedas
     @@index([createdAt])    // Para ordenamiento
   }
   ```

2. **Validaciones en el esquema**
   ```prisma
   model DepositRequest {
     amount Decimal @db.Decimal(10,2) // Precisión específica
     status String  @default("PENDING") // Valor por defecto
     
     @@check(amount > 0) // Constraint de validación
   }
   ```

### Seguridad

1. **Sanitización de entrada**
   ```typescript
   // Usar Zod para validación
   const userSchema = z.object({
     email: z.string().email(),
     username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/)
   });
   ```

2. **Rate limiting granular**
   ```typescript
   // Por endpoint específico
   const paymentRateLimit = createRateLimit(15 * 60 * 1000, 5); // 5 pagos por 15 min
   const loginRateLimit = createRateLimit(15 * 60 * 1000, 10);   // 10 intentos por 15 min
   ```

3. **Logs de auditoría completos**
   ```typescript
   await auditLogger.log({
     userId: user.id,
     action: 'DEPOSIT_APPROVED',
     entity: 'DEPOSIT_REQUEST',
     entityId: deposit.id,
     changes: { status: 'APPROVED' },
     metadata: { adminId: admin.id, amount: deposit.amount }
   });
   ```

### Performance

1. **Caching estratégico**
   ```typescript
   // Cache de configuraciones que cambian poco
   const bankConfigs = await redis.get('bank_configurations');
   if (!bankConfigs) {
     const configs = await prisma.bankConfiguration.findMany();
     await redis.setex('bank_configurations', 3600, JSON.stringify(configs));
   }
   ```

2. **Paginación eficiente**
   ```typescript
   // Cursor-based pagination para mejor performance
   const getTransactions = async (cursor?: string, limit = 10) => {
     return await prisma.transaction.findMany({
       take: limit,
       skip: cursor ? 1 : 0,
       cursor: cursor ? { id: cursor } : undefined,
       orderBy: { createdAt: 'desc' }
     });
   };
   ```

3. **Optimización de queries**
   ```typescript
   // ✅ Incluir relaciones necesarias
   const user = await prisma.user.findUnique({
     where: { id: userId },
     include: { 
       wallet: true,
       depositRequests: {
         where: { status: 'PENDING' },
         orderBy: { createdAt: 'desc' },
         take: 5
       }
     }
   });

   // ❌ N+1 queries
   const users = await prisma.user.findMany();
   for (const user of users) {
     const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
   }
   ```

---

*Guía completa de desarrollo actualizada con todas las mejores prácticas implementadas en el proyecto.*
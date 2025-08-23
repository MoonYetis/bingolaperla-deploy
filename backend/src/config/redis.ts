import { createClient } from 'redis';
import { env } from '@/config/environment';
import { logger } from '@/utils/logger';

const globalForRedis = globalThis as unknown as {
  redis: ReturnType<typeof createClient> | undefined;
};

export const redis =
  globalForRedis.redis ??
  createClient({
    url: env.REDIS_URL,
    socket: {
      reconnectStrategy: () => false, // Desactivar reconexión automática para desarrollo
    },
  });

if (env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}

// Event listeners para Redis
redis.on('connect', () => {
  logger.info('🔗 Conectando a Redis...');
});

redis.on('ready', () => {
  logger.info('✅ Redis listo para usar');
});

redis.on('error', (error) => {
  logger.error('❌ Error de Redis:', error);
});

redis.on('end', () => {
  logger.info('🔌 Conexión Redis cerrada');
});

redis.on('reconnecting', () => {
  logger.warn('🔄 Reintentando conexión a Redis...');
});

// Función para conectar a Redis
export const connectRedis = async () => {
  try {
    if (!redis.isOpen) {
      await redis.connect();
    }
    
    // Verificar que Redis esté funcionando
    await redis.ping();
    logger.info('✅ Conexión a Redis establecida exitosamente');
  } catch (error) {
    logger.error('❌ Error al conectar con Redis:', error);
    logger.warn('⚠️ Continuando sin Redis para desarrollo');
    // No lanzar error para permitir que el servidor inicie sin Redis
  }
};

// Función para desconectar Redis
export const disconnectRedis = async () => {
  try {
    if (redis.isOpen) {
      await redis.quit();
    }
    logger.info('🔌 Desconectado de Redis');
  } catch (error) {
    logger.error('❌ Error al desconectar de Redis:', error);
    throw error;
  }
};

// Utilidades de cache
export const cacheService = {
  // Obtener valor del cache
  get: async (key: string) => {
    try {
      if (!redis.isOpen) return null;
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`❌ Error al obtener del cache [${key}]:`, error);
      return null;
    }
  },

  // Guardar en cache con TTL
  set: async (key: string, value: any, ttlSeconds: number = 3600) => {
    try {
      if (!redis.isOpen) return false;
      await redis.setEx(key, ttlSeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error(`❌ Error al guardar en cache [${key}]:`, error);
      return false;
    }
  },

  // Eliminar del cache
  del: async (key: string) => {
    try {
      if (!redis.isOpen) return false;
      await redis.del(key);
      return true;
    } catch (error) {
      logger.error(`❌ Error al eliminar del cache [${key}]:`, error);
      return false;
    }
  },

  // Limpiar cache por patrón
  delPattern: async (pattern: string) => {
    try {
      if (!redis.isOpen) return 0;
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(keys);
      }
      return keys.length;
    } catch (error) {
      logger.error(`❌ Error al limpiar cache por patrón [${pattern}]:`, error);
      return 0;
    }
  },

  // Verificar si existe una key
  exists: async (key: string) => {
    try {
      if (!redis.isOpen) return false;
      return await redis.exists(key) === 1;
    } catch (error) {
      logger.error(`❌ Error al verificar existencia en cache [${key}]:`, error);
      return false;
    }
  },
};

// Manejo de cierre graceful
process.on('beforeExit', async () => {
  await disconnectRedis();
});

process.on('SIGINT', async () => {
  await disconnectRedis();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectRedis();
  process.exit(0);
});
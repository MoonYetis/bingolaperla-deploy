"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheService = exports.disconnectRedis = exports.connectRedis = exports.redis = void 0;
const redis_1 = require("redis");
const environment_1 = require("@/config/environment");
const logger_1 = require("@/utils/logger");
const globalForRedis = globalThis;
exports.redis = globalForRedis.redis ??
    (0, redis_1.createClient)({
        url: environment_1.env.REDIS_URL,
        socket: {
            reconnectStrategy: (retries) => {
                if (retries > 10) {
                    logger_1.logger.error('❌ Redis: Máximo número de reintentos alcanzado');
                    return false;
                }
                return Math.min(retries * 100, 3000);
            },
        },
    });
if (environment_1.env.NODE_ENV !== 'production') {
    globalForRedis.redis = exports.redis;
}
// Event listeners para Redis
exports.redis.on('connect', () => {
    logger_1.logger.info('🔗 Conectando a Redis...');
});
exports.redis.on('ready', () => {
    logger_1.logger.info('✅ Redis listo para usar');
});
exports.redis.on('error', (error) => {
    logger_1.logger.error('❌ Error de Redis:', error);
});
exports.redis.on('end', () => {
    logger_1.logger.info('🔌 Conexión Redis cerrada');
});
exports.redis.on('reconnecting', () => {
    logger_1.logger.warn('🔄 Reintentando conexión a Redis...');
});
// Función para conectar a Redis
const connectRedis = async () => {
    try {
        if (!exports.redis.isOpen) {
            await exports.redis.connect();
        }
        // Verificar que Redis esté funcionando
        await exports.redis.ping();
        logger_1.logger.info('✅ Conexión a Redis establecida exitosamente');
    }
    catch (error) {
        logger_1.logger.error('❌ Error al conectar con Redis:', error);
        throw error;
    }
};
exports.connectRedis = connectRedis;
// Función para desconectar Redis
const disconnectRedis = async () => {
    try {
        if (exports.redis.isOpen) {
            await exports.redis.quit();
        }
        logger_1.logger.info('🔌 Desconectado de Redis');
    }
    catch (error) {
        logger_1.logger.error('❌ Error al desconectar de Redis:', error);
        throw error;
    }
};
exports.disconnectRedis = disconnectRedis;
// Utilidades de cache
exports.cacheService = {
    // Obtener valor del cache
    get: async (key) => {
        try {
            const value = await exports.redis.get(key);
            return value ? JSON.parse(value) : null;
        }
        catch (error) {
            logger_1.logger.error(`❌ Error al obtener del cache [${key}]:`, error);
            return null;
        }
    },
    // Guardar en cache con TTL
    set: async (key, value, ttlSeconds = 3600) => {
        try {
            await exports.redis.setEx(key, ttlSeconds, JSON.stringify(value));
            return true;
        }
        catch (error) {
            logger_1.logger.error(`❌ Error al guardar en cache [${key}]:`, error);
            return false;
        }
    },
    // Eliminar del cache
    del: async (key) => {
        try {
            await exports.redis.del(key);
            return true;
        }
        catch (error) {
            logger_1.logger.error(`❌ Error al eliminar del cache [${key}]:`, error);
            return false;
        }
    },
    // Limpiar cache por patrón
    delPattern: async (pattern) => {
        try {
            const keys = await exports.redis.keys(pattern);
            if (keys.length > 0) {
                await exports.redis.del(keys);
            }
            return keys.length;
        }
        catch (error) {
            logger_1.logger.error(`❌ Error al limpiar cache por patrón [${pattern}]:`, error);
            return 0;
        }
    },
    // Verificar si existe una key
    exists: async (key) => {
        try {
            return await exports.redis.exists(key) === 1;
        }
        catch (error) {
            logger_1.logger.error(`❌ Error al verificar existencia en cache [${key}]:`, error);
            return false;
        }
    },
};
// Manejo de cierre graceful
process.on('beforeExit', async () => {
    await (0, exports.disconnectRedis)();
});
process.on('SIGINT', async () => {
    await (0, exports.disconnectRedis)();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    await (0, exports.disconnectRedis)();
    process.exit(0);
});
//# sourceMappingURL=redis.js.map
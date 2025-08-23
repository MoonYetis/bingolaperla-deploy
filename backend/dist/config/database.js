"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanDatabase = exports.disconnectDatabase = exports.connectDatabase = exports.prisma = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("@/utils/logger");
const environment_1 = require("@/config/environment");
const globalForPrisma = globalThis;
exports.prisma = globalForPrisma.prisma ??
    new client_1.PrismaClient({
        log: environment_1.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
        errorFormat: 'pretty',
    });
if (environment_1.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = exports.prisma;
}
// Función para conectar a la base de datos
const connectDatabase = async () => {
    try {
        await exports.prisma.$connect();
        logger_1.logger.info('✅ Conexión a PostgreSQL establecida exitosamente');
        // Verificar que la base de datos esté funcionando
        await exports.prisma.$queryRaw `SELECT 1`;
        logger_1.logger.info('✅ Base de datos PostgreSQL funcionando correctamente');
    }
    catch (error) {
        logger_1.logger.error('❌ Error al conectar con PostgreSQL:', error);
        logger_1.logger.warn('⚠️ Continuando sin conexión a base de datos para desarrollo');
        // No lanzar error para permitir que el servidor inicie sin BD
    }
};
exports.connectDatabase = connectDatabase;
// Función para desconectar de la base de datos
const disconnectDatabase = async () => {
    try {
        await exports.prisma.$disconnect();
        logger_1.logger.info('🔌 Desconectado de PostgreSQL');
    }
    catch (error) {
        logger_1.logger.error('❌ Error al desconectar de PostgreSQL:', error);
        throw error;
    }
};
exports.disconnectDatabase = disconnectDatabase;
// Función para limpiar la base de datos (útil para testing)
const cleanDatabase = async () => {
    if (environment_1.env.NODE_ENV !== 'test') {
        throw new Error('cleanDatabase solo puede ser usado en ambiente de testing');
    }
    const tablenames = await exports.prisma.$queryRaw `SELECT tablename FROM pg_tables WHERE schemaname='public'`;
    const tables = tablenames
        .map(({ tablename }) => tablename)
        .filter((name) => name !== '_prisma_migrations')
        .map((name) => `"public"."${name}"`)
        .join(', ');
    try {
        await exports.prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
        logger_1.logger.info('🧹 Base de datos limpiada para testing');
    }
    catch (error) {
        logger_1.logger.error('❌ Error al limpiar la base de datos:', error);
        throw error;
    }
};
exports.cleanDatabase = cleanDatabase;
// Manejo de cierre graceful
process.on('beforeExit', async () => {
    await (0, exports.disconnectDatabase)();
});
process.on('SIGINT', async () => {
    await (0, exports.disconnectDatabase)();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    await (0, exports.disconnectDatabase)();
    process.exit(0);
});
//# sourceMappingURL=database.js.map
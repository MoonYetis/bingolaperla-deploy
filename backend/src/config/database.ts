import { PrismaClient } from '@prisma/client';
import { logger } from '@/utils/logger';
import { env } from '@/config/environment';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'pretty',
  });

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Función para conectar a la base de datos
export const connectDatabase = async () => {
  try {
    await prisma.$connect();
    logger.info('✅ Conexión a PostgreSQL establecida exitosamente');
    
    // Verificar que la base de datos esté funcionando
    await prisma.$queryRaw`SELECT 1`;
    logger.info('✅ Base de datos PostgreSQL funcionando correctamente');
  } catch (error) {
    logger.error('❌ Error al conectar con PostgreSQL:', error);
    logger.warn('⚠️ Continuando sin conexión a base de datos para desarrollo');
    // No lanzar error para permitir que el servidor inicie sin BD
  }
};

// Función para desconectar de la base de datos
export const disconnectDatabase = async () => {
  try {
    await prisma.$disconnect();
    logger.info('🔌 Desconectado de PostgreSQL');
  } catch (error) {
    logger.error('❌ Error al desconectar de PostgreSQL:', error);
    throw error;
  }
};

// Función para limpiar la base de datos (útil para testing)
export const cleanDatabase = async () => {
  if (env.NODE_ENV !== 'test') {
    throw new Error('cleanDatabase solo puede ser usado en ambiente de testing');
  }
  
  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== '_prisma_migrations')
    .map((name) => `"public"."${name}"`)
    .join(', ');

  try {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
    logger.info('🧹 Base de datos limpiada para testing');
  } catch (error) {
    logger.error('❌ Error al limpiar la base de datos:', error);
    throw error;
  }
};

// Manejo de cierre graceful
process.on('beforeExit', async () => {
  await disconnectDatabase();
});

process.on('SIGINT', async () => {
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectDatabase();
  process.exit(0);
});
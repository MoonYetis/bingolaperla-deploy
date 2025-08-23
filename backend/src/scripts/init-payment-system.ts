import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/structuredLogger';

const prisma = new PrismaClient();

async function initializePaymentSystem() {
  logger.info('🏦 Inicializando Sistema de Pagos "Perlas"...');

  try {
    // 1. Crear configuraciones de bancos peruanos
    const bankConfigs = [
      {
        bankCode: 'BCP',
        bankName: 'Banco de Crédito del Perú',
        accountNumber: '19410005001234567',
        accountType: 'SAVINGS',
        accountHolderName: 'BINGO LA PERLA S.A.C.',
        cci: '00219410005001234567',
        isActive: true,
        minDeposit: 10.00,
        maxDeposit: 5000.00,
        depositCommission: 0.00,
        instructions: 'Depositar a cuenta de ahorros BCP. Incluir código de referencia en concepto.'
      },
      {
        bankCode: 'BBVA',
        bankName: 'BBVA Continental',
        accountNumber: '00110018900100123456',
        accountType: 'CHECKING',
        accountHolderName: 'BINGO LA PERLA S.A.C.',
        cci: '01100110018900100123456',
        isActive: true,
        minDeposit: 10.00,
        maxDeposit: 5000.00,
        depositCommission: 0.00,
        instructions: 'Transferir a cuenta corriente BBVA. Usar código de referencia como concepto.'
      },
      {
        bankCode: 'INTERBANK',
        bankName: 'Interbank',
        accountNumber: '89890012345678901',
        accountType: 'SAVINGS',
        accountHolderName: 'BINGO LA PERLA S.A.C.',
        cci: '00389890012345678901',
        isActive: true,
        minDeposit: 10.00,
        maxDeposit: 5000.00,
        depositCommission: 0.00,
        instructions: 'Depositar en cuenta de ahorros Interbank. Indicar código de referencia.'
      },
      {
        bankCode: 'SCOTIABANK',
        bankName: 'Scotiabank Perú',
        accountNumber: '00012345678901234567',
        accountType: 'SAVINGS',
        accountHolderName: 'BINGO LA PERLA S.A.C.',
        cci: '00910012345678901234567',
        isActive: true,
        minDeposit: 10.00,
        maxDeposit: 5000.00,
        depositCommission: 0.00,
        instructions: 'Depósito a cuenta de ahorros Scotia. Incluir referencia en detalle.'
      }
    ];

    for (const config of bankConfigs) {
      await prisma.bankConfiguration.upsert({
        where: { bankCode: config.bankCode },
        update: config,
        create: config
      });
      logger.info(`✅ Configuración bancaria creada/actualizada: ${config.bankName}`);
    }

    // 2. Crear configuración del sistema de pagos
    const paymentConfig = {
      p2pTransferEnabled: true,
      p2pTransferCommission: 2.50, // 2.5 soles por transferencia P2P
      defaultDailyLimit: 1000.00,
      defaultMonthlyLimit: 20000.00,
      depositExpirationHours: 24,
      referenceExpirationHours: 48,
      depositsEnabled: true,
      withdrawalsEnabled: true,
      transfersEnabled: true,
      maintenanceMessage: null,
      announcementMessage: '¡Bienvenido al sistema de Perlas! 1 Perla = 1 Sol Peruano'
    };

    await prisma.paymentConfiguration.upsert({
      where: { id: 'payment-config-v1' },
      update: paymentConfig,
      create: {
        id: 'payment-config-v1',
        ...paymentConfig
      }
    });

    logger.info('✅ Configuración del sistema de pagos creada');

    // 3. Crear billeteras para usuarios existentes
    const users = await prisma.user.findMany({
      where: {
        wallet: null
      }
    });

    for (const user of users) {
      await prisma.wallet.create({
        data: {
          userId: user.id,
          balance: 0.00,
          dailyLimit: 1000.00,
          monthlyLimit: 20000.00,
          isActive: true,
          isFrozen: false
        }
      });
      logger.info(`✅ Billetera creada para usuario: ${user.username}`);
    }

    // 4. Registrar evento de auditoría
    await prisma.auditLog.create({
      data: {
        userId: null,
        adminId: null,
        action: 'PAYMENT_SYSTEM_INITIALIZED',
        entity: 'SYSTEM',
        entityId: 'payment-system',
        description: 'Sistema de Pagos "Perlas" inicializado correctamente',
        ipAddress: '127.0.0.1',
        userAgent: 'payment-init-script'
      }
    });

    logger.info('🎉 Sistema de Pagos "Perlas" inicializado exitosamente!');
    logger.info('📊 Resumen de inicialización:', {
      banksConfigured: bankConfigs.length,
      walletsCreated: users.length,
      systemConfigured: true
    });

  } catch (error) {
    logger.error('❌ Error inicializando sistema de pagos:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  initializePaymentSystem()
    .then(() => {
      console.log('✅ Inicialización completada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en inicialización:', error);
      process.exit(1);
    });
}

export { initializePaymentSystem };
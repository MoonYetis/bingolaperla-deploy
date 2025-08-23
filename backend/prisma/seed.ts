import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seeding de la base de datos...');

  // Crear usuario administrador
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@bingo-la-perla.com',
      username: 'admin',
      password: '$2a$12$hyIaR/L6fxooqdnN0Gq0feLGFdBo3n08jT/wfzhEteX6fqKDhJcJi', // password123
      role: 'ADMIN',
      fullName: 'Administrador Sistema',
      phone: '+51-999-123-456',
    },
  });

  // Crear usuarios de prueba
  const testUser = await prisma.user.create({
    data: {
      email: 'jugador@test.com',
      username: 'usuario',
      password: '$2a$12$hyIaR/L6fxooqdnN0Gq0feLGFdBo3n08jT/wfzhEteX6fqKDhJcJi', // password123
      role: 'USER',
      fullName: 'Jugador de Prueba',
      phone: '+51-999-654-321',
    },
  });

  const player2 = await prisma.user.create({
    data: {
      email: 'maria@test.com',
      username: 'maria_gamer',
      password: '$2a$12$hyIaR/L6fxooqdnN0Gq0feLGFdBo3n08jT/wfzhEteX6fqKDhJcJi', // password123
      role: 'USER',
      fullName: 'María González',
      phone: '+51-999-789-012',
    },
  });

  console.log('✅ Usuarios creados (admin, usuario, maria_gamer)');

  // Crear wallets para los usuarios
  const adminWallet = await prisma.wallet.create({
    data: {
      userId: adminUser.id,
      balance: 1000.00, // Admin empieza con 1000 Perlas
      dailyLimit: 10000.00,
      monthlyLimit: 100000.00,
    },
  });

  const userWallet = await prisma.wallet.create({
    data: {
      userId: testUser.id,
      balance: 150.00, // Usuario empieza con 150 Perlas
      dailyLimit: 1000.00,
      monthlyLimit: 10000.00,
    },
  });

  const mariaWallet = await prisma.wallet.create({
    data: {
      userId: player2.id,
      balance: 75.00, // María empieza con 75 Perlas
      dailyLimit: 1000.00,
      monthlyLimit: 10000.00,
    },
  });

  console.log('✅ Wallets creados con balances iniciales');

  // Crear configuraciones de bancos peruanos
  await prisma.bankConfiguration.createMany({
    data: [
      {
        bankName: 'Banco de Crédito del Perú',
        bankCode: 'BCP',
        accountNumber: '194-123456789-0-12',
        accountType: 'SAVINGS',
        accountHolderName: 'Bingo La Perla EIRL',
        cci: '00219412345678901234',
        isActive: true,
        minDeposit: 10.00,
        maxDeposit: 1000.00,
      },
      {
        bankName: 'BBVA Continental',
        bankCode: 'BBVA',
        accountNumber: '011-01-123456789-12',
        accountType: 'CHECKING',
        accountHolderName: 'Bingo La Perla EIRL',
        cci: '01101112345678901234',
        isActive: true,
        minDeposit: 10.00,
        maxDeposit: 1000.00,
      },
      {
        bankName: 'Interbank',
        bankCode: 'IBK',
        accountNumber: '898-987654321-0-21',
        accountType: 'SAVINGS',
        accountHolderName: 'Bingo La Perla EIRL',
        cci: '00389898765432101234',
        isActive: true,
        minDeposit: 10.00,
        maxDeposit: 1000.00,
      },
      {
        bankName: 'Scotiabank Perú',
        bankCode: 'SCOTIA',
        accountNumber: '000-456789123-45',
        accountType: 'SAVINGS',
        accountHolderName: 'Bingo La Perla EIRL',
        cci: '00900045678912345678',
        isActive: true,
        minDeposit: 10.00,
        maxDeposit: 1000.00,
      },
    ],
  });

  console.log('✅ Configuraciones bancarias creadas');

  // Crear configuración de pagos
  await prisma.paymentConfiguration.create({
    data: {
      p2pTransferEnabled: true,
      p2pTransferCommission: 2.50, // 2.50 soles de comisión por transferencia P2P
      defaultDailyLimit: 1000.00,
      defaultMonthlyLimit: 10000.00,
      depositExpirationHours: 24,
      referenceExpirationHours: 48,
      depositsEnabled: true,
      withdrawalsEnabled: true,
      transfersEnabled: true,
      maintenanceMessage: null,
      announcementMessage: 'Sistema de Perlas funcionando correctamente',
    },
  });

  console.log('✅ Configuración de pagos creada');

  // Crear partida de ejemplo
  const now = new Date();
  const gameInProgress = await prisma.game.create({
    data: {
      title: 'Bingo Tarde Especial',
      description: 'Bingo de la tarde con cartones gratis',
      maxPlayers: 50,
      cardPrice: 5.00,
      totalPrize: 250.00,
      status: 'IN_PROGRESS',
      scheduledAt: new Date(now.getTime() - 30 * 60 * 1000),
      ballsDrawn: JSON.stringify([7, 23, 34, 52, 68, 15, 41, 59, 12, 28]),
      currentBall: 28,
      winningCards: '[]',
    },
  });

  console.log('✅ Partida creada');

  // Crear algunas transacciones de ejemplo para historial
  await prisma.transaction.create({
    data: {
      userId: testUser.id,
      type: 'PEARL_PURCHASE',
      amount: 100.00,
      status: 'COMPLETED',
      description: 'Depósito inicial de bienvenida',
      fromUserId: testUser.id,
    },
  });

  await prisma.transaction.create({
    data: {
      userId: testUser.id,
      type: 'PEARL_TRANSFER',
      amount: 25.00,
      status: 'COMPLETED',
      description: 'Transferencia entre usuarios',
      fromUserId: testUser.id,
      toUserId: player2.id,
    },
  });

  await prisma.transaction.create({
    data: {
      userId: testUser.id,
      type: 'CARD_PURCHASE',
      amount: 15.00,
      status: 'COMPLETED',
      description: 'Compra de cartones de bingo',
      fromUserId: testUser.id,
    },
  });

  console.log('✅ Transacciones de ejemplo creadas');

  // Crear algunos depósitos pendientes para demostrar la funcionalidad admin
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  await prisma.depositRequest.create({
    data: {
      user: { connect: { id: testUser.id } },
      amount: 50.00,
      pearlsAmount: 50.00,
      paymentMethod: 'BCP',
      referenceCode: 'DEP-BCP-' + Date.now(),
      bankReference: 'BCP-REF-123456',
      status: 'PENDING',
      expiresAt: tomorrow,
    },
  });

  await prisma.depositRequest.create({
    data: {
      user: { connect: { id: player2.id } },
      amount: 75.00,
      pearlsAmount: 75.00,
      paymentMethod: 'BBVA',
      referenceCode: 'DEP-BBVA-' + (Date.now() + 1000),
      bankReference: 'BBVA-REF-789012',
      status: 'PENDING',
      expiresAt: tomorrow,
    },
  });

  console.log('✅ Depósitos pendientes creados para demo admin');

  console.log('🎉 Seeding completado exitosamente!');
  console.log('');
  console.log('🔐 CREDENCIALES DE ACCESO:');
  console.log('   Admin:  admin / password123');
  console.log('   User:   usuario / password123');
  console.log('   Extra:  maria_gamer / password123');
  console.log('');
  console.log('💎 BALANCES INICIALES:');
  console.log('   Admin:      1,000.00 Perlas');
  console.log('   Usuario:      150.00 Perlas');
  console.log('   María:         75.00 Perlas');
  console.log('');
  console.log('📋 FUNCIONALIDADES LISTAS:');
  console.log('   ✅ Sistema de pagos Perlas completo');
  console.log('   ✅ Transferencias P2P entre usuarios');
  console.log('   ✅ Panel admin con depósitos pendientes');
  console.log('   ✅ Integración completa con juegos de bingo');
  console.log('   ✅ Notificaciones Socket.IO en tiempo real');
}

main()
  .catch((e) => {
    console.error('Error durante el seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
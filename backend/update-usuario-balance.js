const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateUsuarioBalance() {
  console.log('💎 ACTUALIZANDO BALANCE DEL USUARIO REGULAR PARA PRUEBAS');
  console.log('======================================================');
  
  try {
    // 1. Buscar el usuario por username
    console.log('🔍 Buscando usuario "usuario"...');
    const user = await prisma.user.findUnique({
      where: { username: 'usuario' },
      include: { wallet: true }
    });

    if (!user) {
      console.error('❌ Usuario "usuario" no encontrado');
      return;
    }

    console.log(`✅ Usuario encontrado: ${user.fullName} (${user.email})`);

    // 2. Verificar si tiene wallet
    if (!user.wallet) {
      console.log('⚠️ Usuario no tiene wallet, creando...');
      await prisma.wallet.create({
        data: {
          userId: user.id,
          balance: 150.00,
          dailyLimit: 500.00,
          monthlyLimit: 5000.00,
          isActive: true,
          isFrozen: false
        }
      });
      console.log('✅ Wallet creado con 150.00 Perlas');
    } else {
      console.log(`📊 Balance actual: ${user.wallet.balance} Perlas`);
      
      // 3. Actualizar el balance a 150 Perlas
      const updatedWallet = await prisma.wallet.update({
        where: { userId: user.id },
        data: { balance: 150.00 }
      });
      
      console.log(`✅ Balance actualizado: ${updatedWallet.balance} Perlas`);
    }

    // 4. Crear transacción de ajuste para auditabilidad
    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: 'ADMIN_ADJUSTMENT',
        amount: 150.00,
        pearlsAmount: 150.00,
        description: 'Ajuste de balance para pruebas del sistema',
        status: 'COMPLETED',
        paymentMethod: 'ADMIN_ADJUSTMENT',
        referenceId: `ADJ-${Date.now()}`
      }
    });

    console.log('✅ Transacción de ajuste registrada para auditabilidad');

    // 5. Mostrar información final
    const finalUser = await prisma.user.findUnique({
      where: { username: 'usuario' },
      include: { wallet: true }
    });

    console.log('');
    console.log('🎉 ACTUALIZACIÓN COMPLETADA');
    console.log('===========================');
    console.log('👤 USUARIO PARA PRUEBAS:');
    console.log(`   Email: ${finalUser.email}`);
    console.log(`   Username: ${finalUser.username}`);
    console.log(`   Password: password123`);
    console.log(`   Balance: ${finalUser.wallet.balance} Perlas`);
    console.log('');
    console.log('🧪 PRUEBAS DISPONIBLES:');
    console.log('   ✅ Transferencias P2P a otros usuarios');
    console.log('   ✅ Compra de cartones de bingo');
    console.log('   ✅ Visualización del historial de transacciones');
    console.log('   ✅ Navegación completa del sistema Perlas');
    console.log('');
    console.log('🌐 ACCESO AL SISTEMA:');
    console.log('   Frontend: http://localhost:5173');
    console.log('   Login: usuario / password123');
    
  } catch (error) {
    console.error('❌ Error actualizando balance:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateUsuarioBalance();
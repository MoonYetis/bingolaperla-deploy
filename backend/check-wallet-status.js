const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkWalletStatus() {
  console.log('💎 VERIFICANDO ESTADO DE BILLETERA DEL USUARIO');
  console.log('==============================================');
  
  try {
    // 1. Buscar usuario "usuario"
    const user = await prisma.user.findUnique({
      where: { username: 'usuario' },
      include: { wallet: true }
    });
    
    if (!user) {
      console.log('❌ Usuario "usuario" no encontrado');
      return;
    }
    
    console.log('👤 USUARIO ENCONTRADO:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Activo: ${user.isActive ? 'SÍ' : 'NO'}`);
    
    // 2. Verificar billetera
    if (!user.wallet) {
      console.log('\n❌ BILLETERA NO ENCONTRADA');
      console.log('   Esto explica el problema "No disponible"');
      return;
    }
    
    const wallet = user.wallet;
    
    console.log('\n💎 ESTADO DE BILLETERA:');
    console.log('========================');
    console.log(`   💰 Balance: ${wallet.balance} Perlas`);
    console.log(`   📊 Límite diario: ${wallet.dailyLimit} Perlas`);
    console.log(`   📈 Límite mensual: ${wallet.monthlyLimit} Perlas`);
    console.log(`   ✅ Activa: ${wallet.isActive ? 'SÍ' : 'NO'}`);
    console.log(`   ❄️  Congelada: ${wallet.isFrozen ? 'SÍ' : 'NO'}`);
    console.log(`   📅 Creada: ${wallet.createdAt}`);
    console.log(`   🔄 Actualizada: ${wallet.updatedAt}`);
    
    // 3. Verificar condiciones para compra
    console.log('\n🔍 ANÁLISIS PARA COMPRA DE CARTONES:');
    console.log('=====================================');
    
    const gamePrice = 5; // Precio del juego disponible
    const canPurchaseConditions = {
      walletActive: wallet.isActive,
      walletNotFrozen: !wallet.isFrozen,
      sufficientBalance: parseFloat(wallet.balance.toString()) >= gamePrice
    };
    
    console.log(`   ✅ Billetera activa: ${canPurchaseConditions.walletActive ? 'SÍ' : 'NO'}`);
    console.log(`   ❄️  Billetera NO congelada: ${canPurchaseConditions.walletNotFrozen ? 'SÍ' : 'NO'}`);
    console.log(`   💰 Saldo suficiente (${gamePrice} Perlas): ${canPurchaseConditions.sufficientBalance ? 'SÍ' : 'NO'}`);
    
    const canPurchase = Object.values(canPurchaseConditions).every(condition => condition);
    
    console.log(`\n🎯 PUEDE COMPRAR CARTONES: ${canPurchase ? '✅ SÍ' : '❌ NO'}`);
    
    if (!canPurchase) {
      console.log('\n❌ PROBLEMAS IDENTIFICADOS:');
      if (!canPurchaseConditions.walletActive) {
        console.log('   • Billetera inactiva');
      }
      if (!canPurchaseConditions.walletNotFrozen) {
        console.log('   • Billetera congelada');
      }
      if (!canPurchaseConditions.sufficientBalance) {
        console.log(`   • Saldo insuficiente (tiene ${wallet.balance}, necesita ${gamePrice})`);
      }
    }
    
    // 4. Obtener historial de transacciones recientes
    const recentTransactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    console.log(`\n📊 ÚLTIMAS ${recentTransactions.length} TRANSACCIONES:`);
    console.log('==============================================');
    
    if (recentTransactions.length === 0) {
      console.log('   • No hay transacciones');
    } else {
      recentTransactions.forEach((tx, index) => {
        console.log(`   ${index + 1}. ${tx.type} - ${tx.amount} Perlas`);
        console.log(`      💬 ${tx.description}`);
        console.log(`      📅 ${tx.createdAt}`);
        console.log(`      🔸 Estado: ${tx.status}`);
        console.log('');
      });
    }
    
    // 5. Simular validación como el backend
    console.log('\n🧪 SIMULACIÓN DE VALIDACIÓN BACKEND:');
    console.log('====================================');
    
    const validationResult = {
      canPurchase,
      currentBalance: parseFloat(wallet.balance.toString()),
      requiredAmount: gamePrice,
      message: canPurchase ? 'Compra disponible' : 
               !wallet.isActive || wallet.isFrozen ? 'Billetera suspendida' :
               parseFloat(wallet.balance.toString()) < gamePrice ? `Saldo insuficiente. Necesitas ${gamePrice.toFixed(2)} Perlas` :
               'Error desconocido'
    };
    
    console.log(`   canPurchase: ${validationResult.canPurchase}`);
    console.log(`   currentBalance: ${validationResult.currentBalance}`);
    console.log(`   requiredAmount: ${validationResult.requiredAmount}`);
    console.log(`   message: "${validationResult.message}"`);
    
    if (validationResult.canPurchase) {
      console.log('\n✅ LA BILLETERA ESTÁ LISTA PARA COMPRAS');
      console.log('   El problema debe estar en otro lado');
    } else {
      console.log('\n❌ PROBLEMA EN BILLETERA IDENTIFICADO');
      console.log('   Esta es la causa del "No disponible"');
    }
    
  } catch (error) {
    console.error('❌ Error verificando billetera:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkWalletStatus();
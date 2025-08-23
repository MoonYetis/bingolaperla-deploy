const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateUserBalance() {
  console.log('🔧 Actualizando balance del usuario...');
  
  try {
    // Actualizar balance del usuario admin
    const updatedAdmin = await prisma.user.update({
      where: { username: 'admin' },
      data: { balance: 999.00 }
    });
    
    // Actualizar balance del usuario jugador1
    const updatedUser = await prisma.user.update({
      where: { username: 'jugador1' },
      data: { balance: 999.00 }
    });
    
    console.log('✅ Balance actualizado:');
    console.log(`   - Admin: S/ ${updatedAdmin.balance}`);
    console.log(`   - Jugador1: S/ ${updatedUser.balance}`);
    
    console.log('\n🔐 CREDENCIALES PARA LOGIN:');
    console.log('============================');
    console.log('👨‍💼 ADMIN:');
    console.log('   Username: admin');
    console.log('   Password: password123');
    console.log('   Balance: S/ 999.00');
    console.log('');
    console.log('👤 USUARIO:');
    console.log('   Username: jugador1');
    console.log('   Password: password123');
    console.log('   Balance: S/ 999.00');
    console.log('');
    console.log('🌐 URLS PARA PROBAR:');
    console.log('   - Login: http://localhost:5173/');
    console.log('   - Admin: http://localhost:5173/admin');
    console.log('   - Juego: http://localhost:5173/game/test-game');
    
  } catch (error) {
    console.error('❌ Error actualizando balance:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateUserBalance();
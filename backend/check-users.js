const { PrismaClient } = require('@prisma/client');

async function checkUsers() {
  const prisma = new PrismaClient();

  try {
    console.log('🔍 Verificando usuarios...');
    
    const users = await prisma.users.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true
      }
    });

    console.log(`📊 Total usuarios: ${users.length}`);
    console.log('');

    users.forEach(user => {
      console.log(`- Username: "${user.username}"`);
      console.log(`  Email: "${user.email}"`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Mostrará botón ADMIN: ${user.username === 'admin' ? '✅ SÍ' : '❌ NO'}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
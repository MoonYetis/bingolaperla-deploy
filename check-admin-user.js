const { PrismaClient } = require('./backend/node_modules/@prisma/client');

async function checkAdminUser() {
  const prisma = new PrismaClient();

  try {
    console.log('🔍 Buscando usuarios admin...');
    
    const adminUsers = await prisma.users.findMany({
      where: {
        OR: [
          { email: { contains: 'admin' } },
          { role: 'ADMIN' },
          { username: 'admin' }
        ]
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true
      }
    });

    console.log('📊 Usuarios encontrados:');
    adminUsers.forEach(user => {
      console.log(`- ID: ${user.id}`);
      console.log(`  Username: "${user.username}"`);
      console.log(`  Email: "${user.email}"`);
      console.log(`  Role: ${user.role}`);
      console.log('');
    });

    console.log('🔧 Para MainMenuPage, se verifica:');
    console.log('user?.username === "admin"');
    console.log('');

    adminUsers.forEach(user => {
      const willShowButton = user.username === 'admin';
      console.log(`Usuario "${user.username}" mostrará botón ADMIN: ${willShowButton ? '✅ SÍ' : '❌ NO'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminUser();
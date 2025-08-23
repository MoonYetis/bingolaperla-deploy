const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('🔍 Verificando usuarios en la base de datos...');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true
      }
    });

    console.log(`📊 Total de usuarios: ${users.length}`);
    
    if (users.length === 0) {
      console.log('❌ No hay usuarios en la base de datos');
    } else {
      console.log('\n👥 Usuarios encontrados:');
      users.forEach((user, index) => {
        console.log(`${index + 1}. Email: ${user.email}`);
        console.log(`   Username: ${user.username}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Created: ${user.createdAt}`);
        console.log('');
      });
    }

    // Verificar específicamente los usuarios de prueba
    const testUser = await prisma.user.findUnique({
      where: { email: 'jugador@test.com' }
    });
    
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@test.com' }
    });

    console.log('🎯 Usuarios de prueba específicos:');
    console.log(`- jugador@test.com: ${testUser ? '✅ EXISTS' : '❌ NOT FOUND'}`);
    console.log(`- admin@test.com: ${adminUser ? '✅ EXISTS' : '❌ NOT FOUND'}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
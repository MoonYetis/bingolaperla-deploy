const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function debugAuth() {
  try {
    console.log('🔍 Debug de autenticación...');
    
    // 1. Buscar usuario por email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'jugador@test.com' },
          { username: 'jugador@test.com' },
        ],
      },
    });

    console.log('👤 Usuario encontrado:', user ? '✅ SÍ' : '❌ NO');
    
    if (user) {
      console.log('📧 Email:', user.email);
      console.log('🏷️ Username:', user.username);
      console.log('🔑 Role:', user.role);
      console.log('🔒 Password hash:', user.password.substring(0, 20) + '...');
      
      // 2. Verificar password
      const isPasswordValid = await bcrypt.compare('password123', user.password);
      console.log('🔓 Password válido:', isPasswordValid ? '✅ SÍ' : '❌ NO');
      
      // 3. Verificar que el hash en la DB es correcto
      const testHash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBhTJy3.Mh3.iq';
      const isTestHashValid = await bcrypt.compare('password123', testHash);
      console.log('🧪 Test hash del seed válido:', isTestHashValid ? '✅ SÍ' : '❌ NO');
      
      // 4. Comparar hashes
      console.log('📋 Hash en DB  :', user.password);
      console.log('📋 Hash en seed:', testHash);
      console.log('🔗 Hashes coinciden:', user.password === testHash ? '✅ SÍ' : '❌ NO');
    }

    // También verificar admin
    console.log('\n--- ADMIN ---');
    const admin = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'admin@bingo-la-perla.com' },
          { username: 'admin@bingo-la-perla.com' },
        ],
      },
    });

    console.log('👤 Admin encontrado:', admin ? '✅ SÍ' : '❌ NO');
    
    if (admin) {
      const isAdminPasswordValid = await bcrypt.compare('password123', admin.password);
      console.log('🔓 Admin password válido:', isAdminPasswordValid ? '✅ SÍ' : '❌ NO');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugAuth();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function debugUsers() {
  console.log('🔍 DIAGNÓSTICO COMPLETO DE USUARIOS');
  console.log('===================================');
  
  try {
    // Listar todos los usuarios
    const users = await prisma.user.findMany();
    
    console.log(`\n📊 USUARIOS ENCONTRADOS: ${users.length}`);
    console.log('============================');
    
    users.forEach((user, index) => {
      console.log(`\n👤 USUARIO ${index + 1}:`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Balance: S/ ${user.balance}`);
      console.log(`   Password Hash: ${user.password.substring(0, 20)}...`);
      console.log(`   Created: ${user.createdAt}`);
    });
    
    // Probar comparación de contraseñas
    console.log('\n🔐 PROBANDO CONTRASEÑAS:');
    console.log('========================');
    
    for (const user of users) {
      const passwords = ['password123', '123456', 'admin', 'jugador1'];
      
      console.log(`\n👤 Probando contraseñas para: ${user.username}`);
      
      for (const testPassword of passwords) {
        try {
          const isValid = await bcrypt.compare(testPassword, user.password);
          if (isValid) {
            console.log(`   ✅ CONTRASEÑA VÁLIDA: "${testPassword}"`);
          } else {
            console.log(`   ❌ Contraseña inválida: "${testPassword}"`);
          }
        } catch (error) {
          console.log(`   🚨 Error comparando "${testPassword}": ${error.message}`);
        }
      }
    }
    
    // Crear usuario de prueba simple si es necesario
    console.log('\n🛠️ CREANDO USUARIO DE PRUEBA SIMPLE:');
    console.log('====================================');
    
    try {
      // Eliminar usuario test si existe
      await prisma.user.deleteMany({
        where: { username: 'test' }
      });
      
      // Crear hash simple de contraseña
      const simplePassword = '123456';
      const hashedPassword = await bcrypt.hash(simplePassword, 10);
      
      const testUser = await prisma.user.create({
        data: {
          email: 'test@test.com',
          username: 'test',
          password: hashedPassword,
          role: 'ADMIN',
          balance: 999.00
        }
      });
      
      console.log('✅ Usuario de prueba creado:');
      console.log(`   Username: test`);
      console.log(`   Password: 123456`);
      console.log(`   Balance: S/ 999.00`);
      console.log(`   Role: ADMIN`);
      
      // Verificar que funciona
      const isValid = await bcrypt.compare('123456', testUser.password);
      console.log(`   🔐 Verificación contraseña: ${isValid ? '✅ VÁLIDA' : '❌ INVÁLIDA'}`);
      
    } catch (error) {
      console.log(`❌ Error creando usuario test: ${error.message}`);
    }
    
    console.log('\n🎯 CREDENCIALES PARA PROBAR:');
    console.log('============================');
    console.log('👤 Usuario de prueba simple:');
    console.log('   Username: test');
    console.log('   Password: 123456');
    console.log('');
    console.log('👤 Usuarios existentes:');
    users.forEach(user => {
      console.log(`   Username: ${user.username}`);
      console.log(`   Probar con: password123`);
    });
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugUsers();
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateDemoUserPearls() {
  try {
    console.log('🔍 Actualizando saldo de perlas para usuario demo...')
    
    // Buscar usuario demo (puede ser demo@bingo.com o jugador@test.com)
    let demoUser = await prisma.user.findUnique({
      where: {
        email: 'demo@bingo.com'
      },
      include: {
        wallet: true
      }
    })
    
    // Si no existe demo@bingo.com, buscar jugador@test.com
    if (!demoUser) {
      demoUser = await prisma.user.findUnique({
        where: {
          email: 'jugador@test.com'
        },
        include: {
          wallet: true
        }
      })
    }
    
    if (!demoUser) {
      console.error('❌ Usuario demo no encontrado')
      process.exit(1)
    }
    
    console.log(`✅ Usuario demo encontrado: ${demoUser.username} (${demoUser.email})`)
    console.log(`📊 Balance actual de perlas: ${demoUser.pearlsBalance}`)
    
    // Actualizar balance de perlas en User
    await prisma.user.update({
      where: {
        id: demoUser.id
      },
      data: {
        pearlsBalance: 99.00
      }
    })
    
    // Actualizar o crear wallet si no existe
    if (demoUser.wallet) {
      await prisma.wallet.update({
        where: {
          userId: demoUser.id
        },
        data: {
          balance: 99.00
        }
      })
      console.log('✅ Wallet actualizado')
    } else {
      await prisma.wallet.create({
        data: {
          userId: demoUser.id,
          balance: 99.00,
          dailyLimit: 1000.00,
          monthlyLimit: 10000.00,
          isActive: true,
          isFrozen: false
        }
      })
      console.log('✅ Wallet creado')
    }
    
    // Verificar actualización
    const updatedUser = await prisma.user.findUnique({
      where: {
        id: demoUser.id
      },
      include: {
        wallet: true
      }
    })
    
    console.log('🎉 Actualización completada:')
    console.log(`   - Perlas balance: ${updatedUser?.pearlsBalance}`)
    console.log(`   - Wallet balance: ${updatedUser?.wallet?.balance}`)
    
  } catch (error) {
    console.error('❌ Error actualizando usuario demo:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar script
if (require.main === module) {
  updateDemoUserPearls()
}

export { updateDemoUserPearls }
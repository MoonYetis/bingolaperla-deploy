const { PrismaClient } = require('@prisma/client');

async function cleanTestCards() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Verificando cartones existentes...');
    
    // Buscar el usuario "usuario"
    const user = await prisma.users.findFirst({
      where: { username: 'usuario' }
    });
    
    if (!user) {
      console.log('❌ Usuario "usuario" no encontrado');
      return;
    }
    
    console.log(`✅ Usuario encontrado: ${user.id} (${user.username})`);
    
    // Buscar cartones del usuario
    const cards = await prisma.bingoCards.findMany({
      where: { userId: user.id },
      include: {
        game: {
          select: { id: true, title: true, status: true }
        }
      }
    });
    
    console.log(`📋 Cartones encontrados: ${cards.length}`);
    
    if (cards.length === 0) {
      console.log('✅ No hay cartones para limpiar');
      return;
    }
    
    // Mostrar cartones
    cards.forEach((card, index) => {
      console.log(`  ${index + 1}. Cartón #${card.cardNumber} - Juego: "${card.game.title}" (${card.game.status})`);
      console.log(`     ID Cartón: ${card.id}`);
      console.log(`     ID Juego: ${card.gameId}`);
    });
    
    // Eliminar cartones del juego de prueba
    const testGameId = 'cme7qx0t2000011qsgrp17a6t'; // ID del juego de prueba
    
    const testGameCards = cards.filter(card => card.gameId === testGameId);
    
    if (testGameCards.length > 0) {
      console.log(`\n🗑️  Eliminando ${testGameCards.length} cartones del juego de prueba...`);
      
      // Eliminar números de cartones primero (relación)
      for (const card of testGameCards) {
        await prisma.cardNumbers.deleteMany({
          where: { cardId: card.id }
        });
        console.log(`   ✅ Números del cartón ${card.cardNumber} eliminados`);
      }
      
      // Eliminar cartones
      const deletedCards = await prisma.bingoCards.deleteMany({
        where: {
          userId: user.id,
          gameId: testGameId
        }
      });
      
      console.log(`🎯 ${deletedCards.count} cartones eliminados exitosamente`);
      
      // Actualizar participante del juego
      await prisma.gameParticipants.updateMany({
        where: {
          userId: user.id,
          gameId: testGameId
        },
        data: {
          cardsCount: 0,
          totalSpent: 0
        }
      });
      
      console.log('✅ Participante actualizado - cartones: 0, gasto: 0');
      
    } else {
      console.log('ℹ️  No hay cartones del juego de prueba para eliminar');
    }
    
    console.log('\n🎉 Limpieza completada. Ya puedes comprar cartones nuevamente.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanTestCards();
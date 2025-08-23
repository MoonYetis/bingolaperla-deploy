const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkGamesStatus() {
  console.log('🔍 VERIFICANDO ESTADO DE JUEGOS EN BASE DE DATOS');
  console.log('===============================================');
  
  try {
    // 1. Contar total de juegos
    const totalGames = await prisma.game.count();
    console.log(`📊 Total de juegos en BD: ${totalGames}`);
    
    if (totalGames === 0) {
      console.log('❌ NO HAY JUEGOS EN LA BASE DE DATOS');
      console.log('   Esto explica por qué aparece "No disponible"');
      return;
    }
    
    // 2. Obtener todos los juegos con información detallada
    const games = await prisma.game.findMany({
      include: {
        participants: true,
        _count: {
          select: {
            participants: true,
            bingoCards: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log('\n🎮 JUEGOS ENCONTRADOS:');
    console.log('======================');
    
    games.forEach((game, index) => {
      console.log(`\n${index + 1}. JUEGO: ${game.title}`);
      console.log(`   📋 ID: ${game.id}`);
      console.log(`   🔸 Estado: ${game.status}`);
      console.log(`   💰 Precio cartón: ${game.cardPrice} Perlas`);
      console.log(`   🏆 Premio total: S/ ${game.totalPrize}`);
      console.log(`   👥 Participantes: ${game._count.participants} / ${game.maxPlayers}`);
      console.log(`   🎯 Cartones: ${game._count.bingoCards}`);
      console.log(`   📅 Programado: ${game.scheduledAt}`);
      
      if (game.startedAt) {
        console.log(`   ▶️  Iniciado: ${game.startedAt}`);
      }
      if (game.endedAt) {
        console.log(`   🏁 Terminado: ${game.endedAt}`);
      }
      
      // Verificar si es válido para compras
      const isValid = game.status === 'OPEN' || game.status === 'SCHEDULED';
      const isFull = game._count.participants >= game.maxPlayers;
      
      console.log(`   ✅ Válido para compras: ${isValid ? 'SÍ' : 'NO'}`);
      console.log(`   ⚠️  Está lleno: ${isFull ? 'SÍ' : 'NO'}`);
      
      if (!isValid) {
        console.log(`   ❌ PROBLEMA: Estado "${game.status}" no permite compras`);
      }
    });
    
    // 3. Resumen de estados
    console.log('\n📈 RESUMEN POR ESTADO:');
    console.log('======================');
    
    const stateCounts = {};
    games.forEach(game => {
      stateCounts[game.status] = (stateCounts[game.status] || 0) + 1;
    });
    
    Object.keys(stateCounts).forEach(status => {
      const isValidStatus = status === 'OPEN' || status === 'SCHEDULED';
      const icon = isValidStatus ? '✅' : '❌';
      console.log(`   ${icon} ${status}: ${stateCounts[status]} juego${stateCounts[status] > 1 ? 's' : ''}`);
    });
    
    // 4. Verificar si hay juegos disponibles para compra
    const availableGames = games.filter(g => 
      (g.status === 'OPEN' || g.status === 'SCHEDULED') &&
      g._count.participants < g.maxPlayers
    );
    
    console.log(`\n🎯 JUEGOS DISPONIBLES PARA COMPRA: ${availableGames.length}`);
    
    if (availableGames.length === 0) {
      console.log('\n❌ PROBLEMA IDENTIFICADO:');
      console.log('   No hay juegos en estado OPEN o SCHEDULED disponibles');
      console.log('   Esto causa que aparezca "No disponible" en el frontend');
      
      console.log('\n💡 SOLUCIÓN RECOMENDADA:');
      console.log('   1. Crear juegos en estado OPEN o SCHEDULED');
      console.log('   2. O cambiar estado de juegos existentes');
    } else {
      console.log('\n✅ HAY JUEGOS DISPONIBLES:');
      availableGames.forEach(game => {
        console.log(`   • ${game.title} (${game.status}) - ${game.cardPrice} Perlas`);
      });
    }
    
    // 5. Mostrar el próximo juego que encontraría el frontend
    const nextGame = games.find(g => 
      g.status === 'OPEN' || g.status === 'SCHEDULED'
    ) || games.find(g => g.status === 'IN_PROGRESS');
    
    if (nextGame) {
      console.log(`\n🎮 PRÓXIMO JUEGO PARA FRONTEND: ${nextGame.title}`);
      console.log(`   Estado: ${nextGame.status}`);
      console.log(`   ID: ${nextGame.id}`);
    } else {
      console.log('\n❌ FRONTEND NO ENCONTRARÁ JUEGOS DISPONIBLES');
    }
    
  } catch (error) {
    console.error('❌ Error verificando juegos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkGamesStatus();
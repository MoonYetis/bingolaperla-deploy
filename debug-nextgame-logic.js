// Script para debuggear la lógica de nextGame del DashboardPage

// Datos que recibe el frontend según nuestro test
const gamesData = {
  "message": "Juegos obtenidos exitosamente",
  "games": [
    {
      "id": "game-1",
      "title": "Bingo La Perla - Noche Especial",
      "description": "Juego especial de la noche con premios aumentados",
      "maxPlayers": 100,
      "cardPrice": 15,
      "totalPrize": 1500,
      "status": "OPEN",
      "scheduledAt": "2025-08-12T09:30:31.883Z",
      "ballsDrawn": [],
      "winningCards": [],
      "participantCount": 23,
      "createdAt": "2025-08-11T07:30:31.884Z",
      "updatedAt": "2025-08-12T07:30:31.884Z"
    },
    {
      "id": "game-2",
      "title": "Bingo Matutino Premium",
      "description": "Inicio perfecto para el día con grandes premios",
      "maxPlayers": 80,
      "cardPrice": 12,
      "totalPrize": 960,
      "status": "SCHEDULED",
      "scheduledAt": "2025-08-12T19:30:31.884Z",
      "ballsDrawn": [],
      "winningCards": [],
      "participantCount": 0,
      "createdAt": "2025-08-12T01:30:31.884Z",
      "updatedAt": "2025-08-12T07:30:31.884Z"
    },
    {
      "id": "game-3",
      "title": "Super Bingo Fin de Semana",
      "description": "El juego más grande de la semana con jackpot acumulado",
      "maxPlayers": 200,
      "cardPrice": 25,
      "totalPrize": 5000,
      "status": "IN_PROGRESS",
      "scheduledAt": "2025-08-12T07:00:31.884Z",
      "startedAt": "2025-08-12T07:15:31.884Z",
      "ballsDrawn": [
        7, 23, 45, 12, 56, 33, 8, 67, 19, 42, 71, 14, 38, 52, 29
      ],
      "currentBall": 29,
      "winningCards": [],
      "participantCount": 156,
      "createdAt": "2025-08-10T07:30:31.884Z",
      "updatedAt": "2025-08-12T07:28:31.884Z"
    },
    {
      "id": "game-4",
      "title": "Bingo Express Mediodía",
      "description": "Juego rápido perfecto para el almuerzo",
      "maxPlayers": 50,
      "cardPrice": 8,
      "totalPrize": 400,
      "status": "COMPLETED",
      "scheduledAt": "2025-08-12T04:30:31.884Z",
      "startedAt": "2025-08-12T05:00:31.884Z",
      "endedAt": "2025-08-12T05:18:31.884Z",
      "ballsDrawn": [
        15, 32, 47, 8, 61, 29, 43, 18, 56, 71, 4, 38, 52, 67, 11, 35, 49, 73, 26, 44, 58, 7, 21, 36, 50, 64, 13, 27, 41, 55, 69, 2, 16, 30, 45, 59, 72, 9, 24, 37, 51, 65, 14, 28, 42
      ],
      "currentBall": 42,
      "winningCards": [
        "card-123",
        "card-456"
      ],
      "participantCount": 47,
      "createdAt": "2025-08-09T07:30:31.884Z",
      "updatedAt": "2025-08-12T05:18:31.884Z"
    },
    {
      "id": "game-5",
      "title": "Bingo de la Tarde",
      "description": "Diversión vespertina con premios garantizados",
      "maxPlayers": 75,
      "cardPrice": 10,
      "totalPrize": 750,
      "status": "OPEN",
      "scheduledAt": "2025-08-12T11:30:31.884Z",
      "ballsDrawn": [],
      "winningCards": [],
      "participantCount": 12,
      "createdAt": "2025-08-11T19:30:31.884Z",
      "updatedAt": "2025-08-12T07:30:31.884Z"
    },
    {
      "id": "game-6",
      "title": "Bingo Nocturno VIP",
      "description": "Experiencia premium para jugadores selectos",
      "maxPlayers": 30,
      "cardPrice": 50,
      "totalPrize": 1500,
      "status": "SCHEDULED",
      "scheduledAt": "2025-08-12T15:30:31.884Z",
      "ballsDrawn": [],
      "winningCards": [],
      "participantCount": 0,
      "createdAt": "2025-08-11T13:30:31.884Z",
      "updatedAt": "2025-08-12T07:30:31.884Z"
    }
  ],
  "total": 6
};

// Enum GameStatus como está en el frontend
const GameStatus = {
  SCHEDULED: 'SCHEDULED',
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

console.log('🔍 DEBUGGING LÓGICA DE NEXTGAME');
console.log('===============================');

// Simular la lógica exacta del DashboardPage línea 34-37
const games = gamesData?.games || [];

console.log('📊 JUEGOS DISPONIBLES:');
console.log(`   Total de juegos: ${games.length}`);

games.forEach((game, index) => {
  console.log(`   ${index + 1}. ${game.title} - Status: ${game.status}`);
});

console.log('\n🎯 APLICANDO LÓGICA DE NEXTGAME:');

// Primera parte de la lógica: buscar OPEN o SCHEDULED
console.log('1. Buscando juegos OPEN o SCHEDULED...');
const firstFilter = games.find(g => 
  g.status === GameStatus.OPEN || g.status === GameStatus.SCHEDULED
);

if (firstFilter) {
  console.log(`   ✅ Encontrado: ${firstFilter.title} (${firstFilter.status})`);
} else {
  console.log(`   ❌ No encontrados`);
}

// Segunda parte: si no encuentra, buscar IN_PROGRESS
console.log('2. Si no encuentra OPEN/SCHEDULED, buscar IN_PROGRESS...');
const secondFilter = games.find(g => g.status === GameStatus.IN_PROGRESS);

if (secondFilter) {
  console.log(`   ✅ Encontrado: ${secondFilter.title} (${secondFilter.status})`);
} else {
  console.log(`   ❌ No encontrados`);
}

// Resultado final
const nextGame = firstFilter || secondFilter;

console.log('\n🏆 RESULTADO FINAL:');
if (nextGame) {
  console.log(`   ✅ nextGame: ${nextGame.title}`);
  console.log(`   📊 Status: ${nextGame.status}`);
  console.log(`   💰 Precio: ${nextGame.cardPrice} Perlas`);
  console.log(`   🎯 ID: ${nextGame.id}`);
  
  console.log('\n💡 ESTO SIGNIFICA:');
  console.log('   • nextGame NO es undefined');
  console.log('   • La sección del próximo juego SÍ debería aparecer');
  console.log('   • El botón "COMPRAR CARTONES" SÍ debería ser visible');
  
} else {
  console.log(`   ❌ nextGame: undefined`);
  console.log('\n💡 ESTO SIGNIFICA:');
  console.log('   • nextGame es undefined');
  console.log('   • La sección "No hay juegos disponibles" aparecerá');
  console.log('   • No habrá botón "COMPRAR CARTONES"');
}

console.log('\n🔍 VERIFICANDO COMPARACIONES DE STRINGS:');
console.log(`   'OPEN' === GameStatus.OPEN: ${'OPEN' === GameStatus.OPEN}`);
console.log(`   'SCHEDULED' === GameStatus.SCHEDULED: ${'SCHEDULED' === GameStatus.SCHEDULED}`);
console.log(`   'IN_PROGRESS' === GameStatus.IN_PROGRESS: ${'IN_PROGRESS' === GameStatus.IN_PROGRESS}`);

console.log('\n🚨 CONCLUSIÓN:');
if (nextGame) {
  console.log('   ❓ LA LÓGICA DEBERÍA FUNCIONAR - INVESTIGAR PROBLEMA EN RENDERIZADO');
} else {
  console.log('   ❗ PROBLEMA EN LA LÓGICA DE FILTRADO');
}
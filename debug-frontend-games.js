const axios = require('axios');

async function debugFrontendGames() {
  console.log('🔍 DEBUG: ¿QUÉ JUEGOS VE EL FRONTEND?');
  console.log('=====================================');
  
  try {
    // Llamar a la misma API que usa el frontend
    const response = await axios.get('http://localhost:3001/api/games');
    
    console.log('📊 Respuesta de http://localhost:3001/api/games:');
    console.log(JSON.stringify(response.data, null, 2));
    
    const games = response.data.games || [];
    
    console.log(`\n📋 JUEGOS ENCONTRADOS: ${games.length}`);
    games.forEach((game, index) => {
      console.log(`${index + 1}. ${game.title}`);
      console.log(`   ID: ${game.id}`);
      console.log(`   Estado: ${game.status}`);
      console.log(`   Precio: ${game.cardPrice} Perlas`);
      console.log('');
    });
    
    const availableGames = games.filter(g => g.status === 'OPEN' || g.status === 'SCHEDULED');
    console.log(`🎯 JUEGOS DISPONIBLES: ${availableGames.length}`);
    
    if (availableGames.length > 0) {
      const nextGame = availableGames[0];
      console.log(`📌 PRÓXIMO JUEGO QUE USARÍA EL MODAL:`);
      console.log(`   ID: ${nextGame.id}`);
      console.log(`   Título: ${nextGame.title}`);
      console.log(`   Estado: ${nextGame.status}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

debugFrontendGames();
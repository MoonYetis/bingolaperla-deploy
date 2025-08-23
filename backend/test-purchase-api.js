const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';
const GAME_ID = 'cme7qx0t2000011qsgrp17a6t'; // ID del juego disponible

async function testPurchaseAPI() {
  console.log('🧪 TESTING API DE COMPRA DE CARTONES');
  console.log('====================================');
  
  try {
    // 1. Login para obtener token
    console.log('🔐 1. Haciendo login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'usuario',
      password: 'password123'
    });
    
    if (!loginResponse.data.success || !loginResponse.data.data.tokens) {
      console.log('❌ Error en login:', loginResponse.data);
      return;
    }
    
    const token = loginResponse.data.data.tokens.accessToken;
    console.log('✅ Login exitoso, token obtenido');
    
    // Headers con autenticación
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // 2. Probar validación de compra
    console.log('\n🔍 2. Probando validación de compra...');
    console.log(`   Game ID: ${GAME_ID}`);
    console.log(`   Card Count: 1`);
    
    try {
      const validationResponse = await axios.get(
        `${BASE_URL}/game-purchase/validate/${GAME_ID}/1`,
        { headers }
      );
      
      console.log('✅ Validación exitosa:');
      console.log('   Response:', JSON.stringify(validationResponse.data, null, 2));
      
      const validation = validationResponse.data;
      if (validation.success && validation.data.canPurchase) {
        console.log('✅ VALIDACIÓN: Compra permitida');
        
        // 3. Intentar compra real
        console.log('\n💳 3. Intentando compra real...');
        
        try {
          const purchaseResponse = await axios.post(
            `${BASE_URL}/game-purchase/cards`,
            {
              gameId: GAME_ID,
              cardCount: 1
            },
            { headers }
          );
          
          console.log('🎉 COMPRA EXITOSA:');
          console.log('   Response:', JSON.stringify(purchaseResponse.data, null, 2));
          
        } catch (purchaseError) {
          console.log('❌ Error en compra:', purchaseError.response?.data || purchaseError.message);
        }
        
      } else {
        console.log('❌ VALIDACIÓN: Compra NO permitida');
        console.log('   Razón:', validation.data.message);
      }
      
    } catch (validationError) {
      console.log('❌ Error en validación:', validationError.response?.data || validationError.message);
    }
    
    // 4. Probar obtener balance de wallet
    console.log('\n💰 4. Verificando balance de wallet...');
    try {
      const walletResponse = await axios.get(`${BASE_URL}/wallet/balance`, { headers });
      console.log('✅ Balance wallet:');
      console.log('   Response:', JSON.stringify(walletResponse.data, null, 2));
    } catch (walletError) {
      console.log('❌ Error obteniendo balance:', walletError.response?.data || walletError.message);
    }
    
    // 5. Probar obtener juegos disponibles
    console.log('\n🎮 5. Obteniendo juegos disponibles...');
    try {
      const gamesResponse = await axios.get(`${BASE_URL}/games`, { headers });
      console.log('✅ Juegos disponibles:');
      
      const games = gamesResponse.data.games || [];
      games.forEach((game, index) => {
        console.log(`   ${index + 1}. ${game.title} (${game.status}) - ${game.cardPrice} Perlas`);
        console.log(`      ID: ${game.id}`);
        console.log(`      Participantes: ${game.participantCount || 0} / ${game.maxPlayers}`);
      });
      
      const availableGames = games.filter(g => 
        g.status === 'OPEN' || g.status === 'SCHEDULED'
      );
      console.log(`   📊 Juegos disponibles para compra: ${availableGames.length}`);
      
    } catch (gamesError) {
      console.log('❌ Error obteniendo juegos:', gamesError.response?.data || gamesError.message);
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.response?.data || error.message);
  }
}

// Ejecutar el test
testPurchaseAPI().catch(console.error);
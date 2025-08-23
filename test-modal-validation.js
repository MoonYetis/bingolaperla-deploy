const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';
const GAME_ID = 'cme7qx0t2000011qsgrp17a6t'; // ID del juego SCHEDULED

async function testModalValidation() {
  console.log('🔍 TESTING VALIDACIÓN DEL MODAL');
  console.log('================================');
  
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
    console.log('✅ Login exitoso');
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // 2. Verificar balance de billetera
    console.log('\n💰 2. Verificando balance...');
    try {
      const walletResponse = await axios.get(`${BASE_URL}/wallet/balance`, { headers });
      console.log('✅ Balance wallet:', walletResponse.data);
    } catch (walletError) {
      console.log('❌ Error wallet:', walletError.response?.data || walletError.message);
    }
    
    // 3. Probar validación de compra (como lo hace el modal)
    console.log('\n🧪 3. Probando validación de compra del modal...');
    console.log(`   Game ID: ${GAME_ID}`);
    console.log(`   Card Count: 1`);
    
    try {
      const validationResponse = await axios.get(
        `${BASE_URL}/game-purchase/validate/${GAME_ID}/1`,
        { headers }
      );
      
      console.log('✅ Validación exitosa');
      console.log('   Response completa:', JSON.stringify(validationResponse.data, null, 2));
      
      const validation = validationResponse.data;
      
      console.log('\n📊 ANÁLISIS DE VALIDACIÓN:');
      console.log(`   success: ${validation.success}`);
      console.log(`   canPurchase: ${validation.data?.canPurchase}`);
      console.log(`   message: "${validation.data?.message || validation.message}"`);
      
      if (validation.success && validation.data?.canPurchase) {
        console.log('\n✅ VALIDACIÓN CORRECTA - Modal debería permitir compra');
      } else {
        console.log('\n❌ VALIDACIÓN FALLA - Esta es la causa del problema');
        console.log('   Razón:', validation.data?.message || validation.message);
        
        // Detalles adicionales si están disponibles
        if (validation.data) {
          console.log('\n📋 Detalles de validación:');
          Object.keys(validation.data).forEach(key => {
            if (key !== 'canPurchase' && key !== 'message') {
              console.log(`   ${key}: ${validation.data[key]}`);
            }
          });
        }
      }
      
    } catch (validationError) {
      console.log('❌ Error en validación:', validationError.response?.data || validationError.message);
      
      if (validationError.response?.status === 404) {
        console.log('   💡 Posible causa: Juego no encontrado o endpoint incorrecto');
      } else if (validationError.response?.status === 401) {
        console.log('   💡 Posible causa: Problema de autenticación');
      } else if (validationError.response?.status === 400) {
        console.log('   💡 Posible causa: Parámetros inválidos (gameId o cardCount)');
      }
    }
    
    // 4. Verificar que el juego existe
    console.log('\n🎮 4. Verificando que el juego existe...');
    try {
      const gamesResponse = await axios.get(`${BASE_URL}/games`, { headers });
      const games = gamesResponse.data.games || [];
      const targetGame = games.find(g => g.id === GAME_ID);
      
      if (targetGame) {
        console.log('✅ Juego encontrado:');
        console.log(`   Título: ${targetGame.title}`);
        console.log(`   Estado: ${targetGame.status}`);
        console.log(`   Precio: ${targetGame.cardPrice} Perlas`);
        console.log(`   Participantes: ${targetGame.participantCount || 0} / ${targetGame.maxPlayers}`);
      } else {
        console.log('❌ Juego NO encontrado en la lista');
        console.log('   IDs disponibles:', games.map(g => g.id));
      }
    } catch (gamesError) {
      console.log('❌ Error obteniendo juegos:', gamesError.response?.data || gamesError.message);
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.response?.data || error.message);
  }
}

testModalValidation().catch(console.error);
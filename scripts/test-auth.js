#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testAuthFlow() {
  log('blue', '🧪 Iniciando tests de autenticación...\n');

  const testUser = {
    email: `test-${Date.now()}@ejemplo.com`,
    username: `testuser${Date.now()}`,
    password: 'Test123456',
    confirmPassword: 'Test123456'
  };

  let tokens = null;

  try {
    // Test 1: Health Check
    log('yellow', '1. Testing health check...');
    const healthResponse = await axios.get(`${BASE_URL.replace('/api', '')}/health`);
    if (healthResponse.status === 200) {
      log('green', '✅ Health check passed');
    } else {
      throw new Error('Health check failed');
    }

    // Test 2: Registro de usuario
    log('yellow', '2. Testing user registration...');
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, testUser);
    if (registerResponse.status === 201 && registerResponse.data.tokens) {
      log('green', '✅ User registration successful');
      tokens = registerResponse.data.tokens;
    } else {
      throw new Error('Registration failed');
    }

    // Test 3: Obtener perfil
    log('yellow', '3. Testing get profile...');
    const profileResponse = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${tokens.accessToken}` }
    });
    if (profileResponse.status === 200 && profileResponse.data.user) {
      log('green', '✅ Get profile successful');
    } else {
      throw new Error('Get profile failed');
    }

    // Test 4: Login
    log('yellow', '4. Testing login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      identifier: testUser.email,
      password: testUser.password
    });
    if (loginResponse.status === 200 && loginResponse.data.tokens) {
      log('green', '✅ Login successful');
      tokens = loginResponse.data.tokens;
    } else {
      throw new Error('Login failed');
    }

    // Test 5: Logout
    log('yellow', '5. Testing logout...');
    const logoutResponse = await axios.post(`${BASE_URL}/auth/logout`, {}, {
      headers: { Authorization: `Bearer ${tokens.accessToken}` }
    });
    if (logoutResponse.status === 200) {
      log('green', '✅ Logout successful');
    } else {
      throw new Error('Logout failed');
    }

    // Test 6: Verificar que el token ya no funciona
    log('yellow', '6. Testing token invalidation...');
    try {
      await axios.get(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${tokens.accessToken}` }
      });
      throw new Error('Token should be invalidated');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        log('green', '✅ Token invalidation successful');
      } else {
        throw error;
      }
    }

    // Test 7: Error cases
    log('yellow', '7. Testing error cases...');
    
    // Email duplicado
    try {
      await axios.post(`${BASE_URL}/auth/register`, testUser);
      throw new Error('Should not allow duplicate email');
    } catch (error) {
      if (error.response && error.response.status === 409) {
        log('green', '✅ Duplicate email validation successful');
      } else {
        throw error;
      }
    }

    // Credenciales incorrectas
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        identifier: testUser.email,
        password: 'wrongpassword'
      });
      throw new Error('Should not allow wrong password');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        log('green', '✅ Wrong password validation successful');
      } else {
        throw error;
      }
    }

    log('green', '\n🎉 ¡Todos los tests pasaron exitosamente!');
    log('blue', '\n📊 Resumen:');
    log('blue', '- ✅ Health check');
    log('blue', '- ✅ Registro de usuario');
    log('blue', '- ✅ Obtener perfil');
    log('blue', '- ✅ Login');
    log('blue', '- ✅ Logout');
    log('blue', '- ✅ Invalidación de token');
    log('blue', '- ✅ Validación de errores');

  } catch (error) {
    log('red', `\n❌ Test fallido: ${error.message}`);
    if (error.response) {
      log('red', `Status: ${error.response.status}`);
      log('red', `Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    process.exit(1);
  }
}

// Verificar que el servidor esté corriendo
async function checkServer() {
  try {
    await axios.get(`${BASE_URL.replace('/api', '')}/health`);
    return true;
  } catch (error) {
    return false;
  }
}

async function main() {
  log('blue', '🔍 Verificando que el servidor esté corriendo...');
  
  const serverRunning = await checkServer();
  if (!serverRunning) {
    log('red', '❌ El servidor backend no está corriendo en http://localhost:3001');
    log('yellow', '💡 Ejecuta: cd backend && npm run dev');
    process.exit(1);
  }

  log('green', '✅ Servidor backend detectado');
  await testAuthFlow();
}

if (require.main === module) {
  main();
}
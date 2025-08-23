const bcrypt = require('bcryptjs');

async function generateHash() {
  console.log('🔐 Generando hash correcto para password123...');
  
  const password = 'password123';
  const hash = await bcrypt.hash(password, 12);
  
  console.log('✅ Hash generado:', hash);
  
  // Verificar que funciona
  const isValid = await bcrypt.compare(password, hash);
  console.log('🔓 Verificación:', isValid ? '✅ VÁLIDO' : '❌ INVÁLIDO');
  
  // También verificar el hash del seed
  const seedHash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBhTJy3.Mh3.iq';
  const isSeedValid = await bcrypt.compare(password, seedHash);
  console.log('🧪 Hash del seed:', isSeedValid ? '✅ VÁLIDO' : '❌ INVÁLIDO');
}

generateHash().catch(console.error);
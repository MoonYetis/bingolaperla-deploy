async function globalTeardown() {
  console.log('🧹 Starting global teardown for Bingo La Perla E2E tests...')
  
  // Limpiar archivos temporales de test si es necesario
  // Aquí podrías agregar cleanup de base de datos, etc.
  
  console.log('✅ Global teardown completed')
}

export default globalTeardown
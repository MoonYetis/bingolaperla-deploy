/**
 * Convierte un balance (que puede venir como string desde la DB) a formato de moneda
 */
export const formatBalance = (balance: string | number | undefined | null): string => {
  if (balance === undefined || balance === null) {
    return '0.00'
  }
  
  // Convertir a número si es string
  const numBalance = typeof balance === 'string' ? parseFloat(balance) : balance
  
  // Verificar que sea un número válido
  if (isNaN(numBalance)) {
    return '0.00'
  }
  
  return numBalance.toFixed(2)
}
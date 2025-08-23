/**
 * Utilitarios para formateo de moneda peruana (Soles)
 */

export const formatCurrency = (amount: number | string, showSymbol: boolean = true): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  
  if (isNaN(numAmount)) {
    return showSymbol ? 'S/ 0.00' : '0.00'
  }

  const formatted = numAmount.toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })

  return showSymbol ? `S/ ${formatted}` : formatted
}

export const formatPearls = (amount: number | string): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  
  if (isNaN(numAmount)) {
    return '0.00 Perlas'
  }

  const formatted = numAmount.toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })

  return `${formatted} Perlas`
}

export const parseCurrency = (currencyString: string): number => {
  // Remover símbolos de moneda y espacios
  const cleaned = currencyString.replace(/[S/\s]/g, '').replace(',', '.')
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? 0 : parsed
}

// Validar que un monto sea válido para transacciones
export const isValidAmount = (amount: number, min: number = 0.01, max: number = 999999.99): boolean => {
  return !isNaN(amount) && amount >= min && amount <= max
}

// Formatear porcentajes para comisiones
export const formatPercentage = (percentage: number): string => {
  return `${(percentage * 100).toFixed(1)}%`
}

// Constantes de montos para el sistema peruano
export const CURRENCY_CONSTANTS = {
  MIN_DEPOSIT: 10.00,        // Mínimo depósito en soles
  MAX_DEPOSIT: 10000.00,     // Máximo depósito en soles
  MIN_WITHDRAWAL: 20.00,     // Mínimo retiro en soles
  MAX_WITHDRAWAL: 5000.00,   // Máximo retiro en soles
  MIN_TRANSFER: 5.00,        // Mínima transferencia P2P
  MAX_TRANSFER: 2000.00,     // Máxima transferencia P2P
  DEFAULT_COMMISSION: 2.50,  // Comisión por defecto P2P
  MIN_WITHDRAWAL_COMMISSION: 5.00, // Comisión mínima retiro
} as const
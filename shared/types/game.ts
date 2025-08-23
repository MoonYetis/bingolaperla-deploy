// Tipos compartidos para el sistema de bingo

export interface BingoCardData {
  id: string
  cardNumber: number
  userId: string
  gameId: string
  isActive: boolean
  markedNumbers: number[]
  isWinner: boolean
  winningPattern?: string
  numbers: CardNumberData[]
  createdAt: string
  updatedAt: string
}

export interface CardNumberData {
  id: string
  position: number // 0-24
  column: 'B' | 'I' | 'N' | 'G' | 'O'
  number: number | null
  isMarked: boolean
  isFree: boolean
}

export interface GameData {
  id: string
  title: string
  description?: string
  maxPlayers: number
  cardPrice: number
  totalPrize: number
  status: GameStatus
  scheduledAt: string
  startedAt?: string
  endedAt?: string
  ballsDrawn: number[]
  currentBall?: number
  winningCards: string[]
  participantCount?: number
  createdAt: string
  updatedAt: string
}

export interface GameParticipantData {
  id: string
  userId: string
  gameId: string
  joinedAt: string
  cardsCount: number
  totalSpent: number
  hasWon: boolean
  prizeWon: number
}

export enum GameStatus {
  SCHEDULED = 'SCHEDULED',
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum WinningPattern {
  LINE_HORIZONTAL_1 = 'LINE_HORIZONTAL_1',
  LINE_HORIZONTAL_2 = 'LINE_HORIZONTAL_2', 
  LINE_HORIZONTAL_3 = 'LINE_HORIZONTAL_3',
  LINE_HORIZONTAL_4 = 'LINE_HORIZONTAL_4',
  LINE_HORIZONTAL_5 = 'LINE_HORIZONTAL_5',
  LINE_VERTICAL_B = 'LINE_VERTICAL_B',
  LINE_VERTICAL_I = 'LINE_VERTICAL_I',
  LINE_VERTICAL_N = 'LINE_VERTICAL_N',
  LINE_VERTICAL_G = 'LINE_VERTICAL_G',
  LINE_VERTICAL_O = 'LINE_VERTICAL_O',
  DIAGONAL_TOP_LEFT = 'DIAGONAL_TOP_LEFT',
  DIAGONAL_TOP_RIGHT = 'DIAGONAL_TOP_RIGHT',
  FULL_CARD = 'FULL_CARD',
  FOUR_CORNERS = 'FOUR_CORNERS',
  PATTERN_X = 'PATTERN_X',
  PATTERN_T = 'PATTERN_T',
  PATTERN_L = 'PATTERN_L'
}

// Constantes del bingo 75
export const BINGO_CONSTANTS = {
  GRID_SIZE: 5,
  TOTAL_CELLS: 25,
  FREE_CELL_POSITION: 12, // Posición central (fila 2, columna 2)
  MAX_CARDS_PER_USER: 3,
  COLUMNS: {
    B: { min: 1, max: 15, index: 0 },
    I: { min: 16, max: 30, index: 1 },
    N: { min: 31, max: 45, index: 2 },
    G: { min: 46, max: 60, index: 3 },
    O: { min: 61, max: 75, index: 4 }
  }
} as const

export type ColumnLetter = keyof typeof BINGO_CONSTANTS.COLUMNS

// Utilidades para trabajar con posiciones
export const getRowFromPosition = (position: number): number => Math.floor(position / 5)
export const getColFromPosition = (position: number): number => position % 5
export const getPositionFromRowCol = (row: number, col: number): number => row * 5 + col
export const getColumnLetter = (position: number): ColumnLetter => {
  const col = getColFromPosition(position)
  return ['B', 'I', 'N', 'G', 'O'][col] as ColumnLetter
}

// Patrones de victoria como arrays de posiciones
export const WINNING_PATTERNS = {
  // Líneas horizontales
  [WinningPattern.LINE_HORIZONTAL_1]: [0, 1, 2, 3, 4],
  [WinningPattern.LINE_HORIZONTAL_2]: [5, 6, 7, 8, 9],
  [WinningPattern.LINE_HORIZONTAL_3]: [10, 11, 12, 13, 14],
  [WinningPattern.LINE_HORIZONTAL_4]: [15, 16, 17, 18, 19],
  [WinningPattern.LINE_HORIZONTAL_5]: [20, 21, 22, 23, 24],
  
  // Líneas verticales
  [WinningPattern.LINE_VERTICAL_B]: [0, 5, 10, 15, 20],
  [WinningPattern.LINE_VERTICAL_I]: [1, 6, 11, 16, 21],
  [WinningPattern.LINE_VERTICAL_N]: [2, 7, 12, 17, 22],
  [WinningPattern.LINE_VERTICAL_G]: [3, 8, 13, 18, 23],
  [WinningPattern.LINE_VERTICAL_O]: [4, 9, 14, 19, 24],
  
  // Diagonales
  [WinningPattern.DIAGONAL_TOP_LEFT]: [0, 6, 12, 18, 24],
  [WinningPattern.DIAGONAL_TOP_RIGHT]: [4, 8, 12, 16, 20],
  
  // Cartón completo (todas las posiciones excepto la libre)
  [WinningPattern.FULL_CARD]: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24],
  
  // Cuatro esquinas
  [WinningPattern.FOUR_CORNERS]: [0, 4, 20, 24],
  
  // Patrones especiales
  [WinningPattern.PATTERN_X]: [0, 6, 12, 18, 24, 4, 8, 16, 20],
  [WinningPattern.PATTERN_T]: [0, 1, 2, 3, 4, 7, 12, 17, 22],
  [WinningPattern.PATTERN_L]: [0, 5, 10, 15, 20, 21, 22, 23, 24]
} as const
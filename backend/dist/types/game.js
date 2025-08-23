"use strict";
// Tipos compartidos para el sistema de bingo
Object.defineProperty(exports, "__esModule", { value: true });
exports.WINNING_PATTERNS = exports.getColumnLetter = exports.getPositionFromRowCol = exports.getColFromPosition = exports.getRowFromPosition = exports.BINGO_CONSTANTS = exports.WinningPattern = exports.GameStatus = void 0;
var GameStatus;
(function (GameStatus) {
    GameStatus["SCHEDULED"] = "SCHEDULED";
    GameStatus["OPEN"] = "OPEN";
    GameStatus["IN_PROGRESS"] = "IN_PROGRESS";
    GameStatus["PAUSED"] = "PAUSED";
    GameStatus["COMPLETED"] = "COMPLETED";
    GameStatus["CANCELLED"] = "CANCELLED";
})(GameStatus || (exports.GameStatus = GameStatus = {}));
var WinningPattern;
(function (WinningPattern) {
    WinningPattern["LINE_HORIZONTAL_1"] = "LINE_HORIZONTAL_1";
    WinningPattern["LINE_HORIZONTAL_2"] = "LINE_HORIZONTAL_2";
    WinningPattern["LINE_HORIZONTAL_3"] = "LINE_HORIZONTAL_3";
    WinningPattern["LINE_HORIZONTAL_4"] = "LINE_HORIZONTAL_4";
    WinningPattern["LINE_HORIZONTAL_5"] = "LINE_HORIZONTAL_5";
    WinningPattern["LINE_VERTICAL_B"] = "LINE_VERTICAL_B";
    WinningPattern["LINE_VERTICAL_I"] = "LINE_VERTICAL_I";
    WinningPattern["LINE_VERTICAL_N"] = "LINE_VERTICAL_N";
    WinningPattern["LINE_VERTICAL_G"] = "LINE_VERTICAL_G";
    WinningPattern["LINE_VERTICAL_O"] = "LINE_VERTICAL_O";
    WinningPattern["DIAGONAL_TOP_LEFT"] = "DIAGONAL_TOP_LEFT";
    WinningPattern["DIAGONAL_TOP_RIGHT"] = "DIAGONAL_TOP_RIGHT";
    WinningPattern["FULL_CARD"] = "FULL_CARD";
    WinningPattern["FOUR_CORNERS"] = "FOUR_CORNERS";
    WinningPattern["PATTERN_X"] = "PATTERN_X";
    WinningPattern["PATTERN_T"] = "PATTERN_T";
    WinningPattern["PATTERN_L"] = "PATTERN_L";
})(WinningPattern || (exports.WinningPattern = WinningPattern = {}));
// Constantes del bingo 75
exports.BINGO_CONSTANTS = {
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
};
// Utilidades para trabajar con posiciones
const getRowFromPosition = (position) => Math.floor(position / 5);
exports.getRowFromPosition = getRowFromPosition;
const getColFromPosition = (position) => position % 5;
exports.getColFromPosition = getColFromPosition;
const getPositionFromRowCol = (row, col) => row * 5 + col;
exports.getPositionFromRowCol = getPositionFromRowCol;
const getColumnLetter = (position) => {
    const col = (0, exports.getColFromPosition)(position);
    return ['B', 'I', 'N', 'G', 'O'][col];
};
exports.getColumnLetter = getColumnLetter;
// Patrones de victoria como arrays de posiciones
exports.WINNING_PATTERNS = {
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
};
//# sourceMappingURL=game.js.map
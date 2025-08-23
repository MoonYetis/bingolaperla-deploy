export interface BingoCardData {
    id: string;
    cardNumber: number;
    userId: string;
    gameId: string;
    isActive: boolean;
    markedNumbers: number[];
    isWinner: boolean;
    winningPattern?: string;
    numbers: CardNumberData[];
    createdAt: string;
    updatedAt: string;
}
export interface CardNumberData {
    id: string;
    position: number;
    column: 'B' | 'I' | 'N' | 'G' | 'O';
    number: number | null;
    isMarked: boolean;
    isFree: boolean;
}
export interface GameData {
    id: string;
    title: string;
    description?: string;
    maxPlayers: number;
    cardPrice: number;
    totalPrize: number;
    status: GameStatus;
    scheduledAt: string;
    startedAt?: string;
    endedAt?: string;
    ballsDrawn: number[];
    currentBall?: number;
    winningCards: string[];
    participantCount?: number;
    createdAt: string;
    updatedAt: string;
}
export interface GameParticipantData {
    id: string;
    userId: string;
    gameId: string;
    joinedAt: string;
    cardsCount: number;
    totalSpent: number;
    hasWon: boolean;
    prizeWon: number;
}
export declare enum GameStatus {
    SCHEDULED = "SCHEDULED",
    OPEN = "OPEN",
    IN_PROGRESS = "IN_PROGRESS",
    PAUSED = "PAUSED",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED"
}
export declare enum WinningPattern {
    LINE_HORIZONTAL_1 = "LINE_HORIZONTAL_1",
    LINE_HORIZONTAL_2 = "LINE_HORIZONTAL_2",
    LINE_HORIZONTAL_3 = "LINE_HORIZONTAL_3",
    LINE_HORIZONTAL_4 = "LINE_HORIZONTAL_4",
    LINE_HORIZONTAL_5 = "LINE_HORIZONTAL_5",
    LINE_VERTICAL_B = "LINE_VERTICAL_B",
    LINE_VERTICAL_I = "LINE_VERTICAL_I",
    LINE_VERTICAL_N = "LINE_VERTICAL_N",
    LINE_VERTICAL_G = "LINE_VERTICAL_G",
    LINE_VERTICAL_O = "LINE_VERTICAL_O",
    DIAGONAL_TOP_LEFT = "DIAGONAL_TOP_LEFT",
    DIAGONAL_TOP_RIGHT = "DIAGONAL_TOP_RIGHT",
    FULL_CARD = "FULL_CARD",
    FOUR_CORNERS = "FOUR_CORNERS",
    PATTERN_X = "PATTERN_X",
    PATTERN_T = "PATTERN_T",
    PATTERN_L = "PATTERN_L"
}
export declare const BINGO_CONSTANTS: {
    readonly GRID_SIZE: 5;
    readonly TOTAL_CELLS: 25;
    readonly FREE_CELL_POSITION: 12;
    readonly MAX_CARDS_PER_USER: 3;
    readonly COLUMNS: {
        readonly B: {
            readonly min: 1;
            readonly max: 15;
            readonly index: 0;
        };
        readonly I: {
            readonly min: 16;
            readonly max: 30;
            readonly index: 1;
        };
        readonly N: {
            readonly min: 31;
            readonly max: 45;
            readonly index: 2;
        };
        readonly G: {
            readonly min: 46;
            readonly max: 60;
            readonly index: 3;
        };
        readonly O: {
            readonly min: 61;
            readonly max: 75;
            readonly index: 4;
        };
    };
};
export type ColumnLetter = keyof typeof BINGO_CONSTANTS.COLUMNS;
export declare const getRowFromPosition: (position: number) => number;
export declare const getColFromPosition: (position: number) => number;
export declare const getPositionFromRowCol: (row: number, col: number) => number;
export declare const getColumnLetter: (position: number) => ColumnLetter;
export declare const WINNING_PATTERNS: {
    readonly LINE_HORIZONTAL_1: readonly [0, 1, 2, 3, 4];
    readonly LINE_HORIZONTAL_2: readonly [5, 6, 7, 8, 9];
    readonly LINE_HORIZONTAL_3: readonly [10, 11, 12, 13, 14];
    readonly LINE_HORIZONTAL_4: readonly [15, 16, 17, 18, 19];
    readonly LINE_HORIZONTAL_5: readonly [20, 21, 22, 23, 24];
    readonly LINE_VERTICAL_B: readonly [0, 5, 10, 15, 20];
    readonly LINE_VERTICAL_I: readonly [1, 6, 11, 16, 21];
    readonly LINE_VERTICAL_N: readonly [2, 7, 12, 17, 22];
    readonly LINE_VERTICAL_G: readonly [3, 8, 13, 18, 23];
    readonly LINE_VERTICAL_O: readonly [4, 9, 14, 19, 24];
    readonly DIAGONAL_TOP_LEFT: readonly [0, 6, 12, 18, 24];
    readonly DIAGONAL_TOP_RIGHT: readonly [4, 8, 12, 16, 20];
    readonly FULL_CARD: readonly [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];
    readonly FOUR_CORNERS: readonly [0, 4, 20, 24];
    readonly PATTERN_X: readonly [0, 6, 12, 18, 24, 4, 8, 16, 20];
    readonly PATTERN_T: readonly [0, 1, 2, 3, 4, 7, 12, 17, 22];
    readonly PATTERN_L: readonly [0, 5, 10, 15, 20, 21, 22, 23, 24];
};
//# sourceMappingURL=game.d.ts.map
import { z } from 'zod';
export declare const generateCardsSchema: {
    body: z.ZodObject<{
        gameId: z.ZodString;
        count: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        gameId?: string;
        count?: number;
    }, {
        gameId?: string;
        count?: number;
    }>;
};
export declare const getUserCardsSchema: {
    params: z.ZodObject<{
        userId: z.ZodString;
        gameId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        userId?: string;
        gameId?: string;
    }, {
        userId?: string;
        gameId?: string;
    }>;
};
export declare const getMyCardsSchema: {
    params: z.ZodObject<{
        gameId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        gameId?: string;
    }, {
        gameId?: string;
    }>;
};
export declare const markNumberSchema: {
    params: z.ZodObject<{
        cardId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        cardId?: string;
    }, {
        cardId?: string;
    }>;
    body: z.ZodObject<{
        number: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        number?: number;
    }, {
        number?: number;
    }>;
};
export declare const getCardPatternsSchema: {
    params: z.ZodObject<{
        cardId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        cardId?: string;
    }, {
        cardId?: string;
    }>;
};
export declare const validateCardSchema: {
    body: z.ZodObject<{
        cardNumbers: z.ZodArray<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            position: z.ZodNumber;
            column: z.ZodEnum<["B", "I", "N", "G", "O"]>;
            number: z.ZodNullable<z.ZodNumber>;
            isMarked: z.ZodBoolean;
            isFree: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            number?: number;
            id?: string;
            position?: number;
            column?: "B" | "I" | "N" | "G" | "O";
            isMarked?: boolean;
            isFree?: boolean;
        }, {
            number?: number;
            id?: string;
            position?: number;
            column?: "B" | "I" | "N" | "G" | "O";
            isMarked?: boolean;
            isFree?: boolean;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        cardNumbers?: {
            number?: number;
            id?: string;
            position?: number;
            column?: "B" | "I" | "N" | "G" | "O";
            isMarked?: boolean;
            isFree?: boolean;
        }[];
    }, {
        cardNumbers?: {
            number?: number;
            id?: string;
            position?: number;
            column?: "B" | "I" | "N" | "G" | "O";
            isMarked?: boolean;
            isFree?: boolean;
        }[];
    }>;
};
export declare const deleteCardSchema: {
    params: z.ZodObject<{
        cardId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        cardId?: string;
    }, {
        cardId?: string;
    }>;
};
export type GenerateCardsInput = z.infer<typeof generateCardsSchema>;
export type GetUserCardsInput = z.infer<typeof getUserCardsSchema>;
export type GetMyCardsInput = z.infer<typeof getMyCardsSchema>;
export type MarkNumberInput = z.infer<typeof markNumberSchema>;
export type GetCardPatternsInput = z.infer<typeof getCardPatternsSchema>;
export type ValidateCardInput = z.infer<typeof validateCardSchema>;
export type DeleteCardInput = z.infer<typeof deleteCardSchema>;
//# sourceMappingURL=bingoCardSchemas.d.ts.map
import { Request, Response } from 'express';
export declare class BingoCardController {
    static generateCards(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static getUserCards(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static getMyCards(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static markNumber(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static getCardPatterns(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static validateCard(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static deleteCard(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
export default BingoCardController;
//# sourceMappingURL=bingoCardController.d.ts.map
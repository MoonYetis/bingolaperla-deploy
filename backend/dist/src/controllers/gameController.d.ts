import { Request, Response } from 'express';
export declare class GameController {
    static getAllGames(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static getGameById(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static createGame(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static joinGame(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static startGame(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static drawBall(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static endGame(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
export default GameController;
//# sourceMappingURL=gameController.d.ts.map
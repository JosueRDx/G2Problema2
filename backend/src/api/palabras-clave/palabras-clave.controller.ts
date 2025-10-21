// /backend/src/api/palabras-clave/palabras-clave.controller.ts
import { Request, Response } from 'express';
import * as keywordService from './palabras-clave.service';

export const getKeywordStatsController = async (req: Request, res: Response) => {
    try {
        // Podrías obtener el límite de req.query si quieres hacerlo dinámico
        const stats = await keywordService.getKeywordStats();
        res.status(200).json(stats);
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Error al obtener estadísticas' });
    }
};
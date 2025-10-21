// /backend/src/api/palabras-clave/palabras-clave.service.ts
import dbPool from '../../config/db';
import { RowDataPacket } from 'mysql2/promise';

export const getKeywordStats = async (limit: number = 10) => {
    try {
        // Ensure limit is an integer
        const safeLimit = Math.max(1, Math.floor(limit));

        // Use query instead of execute and directly interpolate the safe limit
        const [rows] = await dbPool.query<RowDataPacket[]>(
            `SELECT palabra, conteo_desafios
             FROM PalabrasClave
             WHERE conteo_desafios > 0
             ORDER BY conteo_desafios DESC
             LIMIT ${safeLimit}` // <-- Change: Use query and interpolate
            // No need for the second argument array anymore: [, [limit]]
        );
        return rows;
    } catch (error: any) {
        console.error("Error fetching keyword stats:", error);
        // Throwing the original error might give more specific details if needed
        // throw error; 
        throw new Error('Error al obtener estadísticas de palabras clave.');
    }
};
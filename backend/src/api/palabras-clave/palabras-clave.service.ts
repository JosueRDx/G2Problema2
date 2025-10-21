// /backend/src/api/palabras-clave/palabras-clave.service.ts
import dbPool from '../../config/db';
import { RowDataPacket } from 'mysql2/promise';

export const getKeywordStats = async (limit: number = 10) => {
    try {
        const [rows] = await dbPool.execute<RowDataPacket[]>(
            `SELECT palabra, conteo_desafios
             FROM PalabrasClave
             WHERE conteo_desafios > 0
             ORDER BY conteo_desafios DESC
             LIMIT ?`,
            [limit]
        );
        return rows;
    } catch (error: any) {
        console.error("Error fetching keyword stats:", error);
        throw new Error('Error al obtener estadísticas de palabras clave.');
    }
};
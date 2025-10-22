// /backend/src/api/cronograma/cronograma.service.ts
import dbPool from '../../config/db';
import { RowDataPacket, OkPacket } from 'mysql2/promise';

// --- Tipos para los datos ---
export interface DiaEvento {
    dia_id?: number;
    dia_numero: number;
    nombre_dia: string;
    fecha: string; // Formato YYYY-MM-DD
}

export interface SesionEvento {
    sesion_id?: number;
    dia_id: number;
    horario_display: string;
    hora_inicio?: string | null; // Formato HH:MM:SS
    hora_fin?: string | null;   // Formato HH:MM:SS
    bloque_tematico: string;
    foco_objetivos?: string | null;
    entregable_clave?: string | null;
}

// --- Funciones del Servicio ---

// Obtener todos los días con sus sesiones (para la agenda pública)
export const getFullSchedule = async () => {
    try {
        const [dias] = await dbPool.query<RowDataPacket[]>(
            `SELECT dia_id, dia_numero, nombre_dia, fecha
              FROM dias_evento
             ORDER BY fecha ASC, dia_numero ASC`
        );

        const schedule = await Promise.all(dias.map(async (dia) => {
            const [sesiones] = await dbPool.query<RowDataPacket[]>(
                `SELECT sesion_id, horario_display, hora_inicio, hora_fin, bloque_tematico, foco_objetivos, entregable_clave
                 FROM sesiones_evento
                 WHERE dia_id = ?
                 ORDER BY hora_inicio ASC, sesion_id ASC`,
                [dia.dia_id]
            );
            return { ...dia, sesiones: sesiones as SesionEvento[] };
        }));

        return schedule;
    } catch (error: any) {
        console.error("Error fetching full schedule:", error);
        throw new Error('Error al obtener el cronograma completo.');
    }
};

// --- Operaciones CRUD para Días (Admin) ---

export const getAllDiasAdmin = async () => {
    try {
        const [rows] = await dbPool.query<RowDataPacket[]>(
            `SELECT * FROM dias_evento ORDER BY fecha ASC, dia_numero ASC`
        );
        return rows as DiaEvento[];
    } catch (error) {
        console.error("Error fetching dias:", error);
        throw new Error('Error al obtener los días del evento.');
    }
};

export const createDia = async (data: DiaEvento): Promise<OkPacket> => {
    try {
        const [result] = await dbPool.execute<OkPacket>(
            'INSERT INTO dias_evento (dia_numero, nombre_dia, fecha) VALUES (?, ?, ?)',
            [data.dia_numero, data.nombre_dia, data.fecha]
        );
        return result;
    } catch (error) {
        console.error("Error creating dia:", error);
        throw new Error('Error al crear el día del evento.');
    }
};

export const updateDia = async (id: number, data: DiaEvento): Promise<OkPacket> => {
     try {
        const [result] = await dbPool.execute<OkPacket>(
            'UPDATE dias_evento SET dia_numero = ?, nombre_dia = ?, fecha = ? WHERE dia_id = ?',
            [data.dia_numero, data.nombre_dia, data.fecha, id]
        );
        return result;
    } catch (error) {
        console.error(`Error updating dia ${id}:`, error);
        throw new Error('Error al actualizar el día del evento.');
    }
};

export const deleteDia = async (id: number): Promise<OkPacket> => {
     try {
        // Asegúrate que la BD tiene ON DELETE CASCADE o maneja sesiones huérfanas
        const [result] = await dbPool.execute<OkPacket>(
            'DELETE FROM dias_evento WHERE dia_id = ?',
            [id]
        );
        return result;
    } catch (error) {
        console.error(`Error deleting dia ${id}:`, error);
        throw new Error('Error al eliminar el día del evento.');
    }
};

// --- Operaciones CRUD para Sesiones (Admin) ---

export const getAllSesionesAdmin = async () => {
     try {
        const [rows] = await dbPool.query<RowDataPacket[]>(
            `SELECT s.*, d.nombre_dia
             FROM sesiones_evento s
             JOIN dias_evento d ON s.dia_id = d.dia_id
             ORDER BY d.fecha ASC, s.hora_inicio ASC, s.sesion_id ASC`
        );
        return rows as (SesionEvento & { nombre_dia: string })[]; // Agrega nombre_dia al tipo
    } catch (error) {
        console.error("Error fetching sesiones:", error);
        throw new Error('Error al obtener las sesiones del evento.');
    }
};

export const createSesion = async (data: SesionEvento): Promise<OkPacket> => {
    try {
        const [result] = await dbPool.execute<OkPacket>(
            `INSERT INTO sesiones_evento
             (dia_id, horario_display, hora_inicio, hora_fin, bloque_tematico, foco_objetivos, entregable_clave)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                data.dia_id,
                data.horario_display,
                data.hora_inicio || null,
                data.hora_fin || null,
                data.bloque_tematico,
                data.foco_objetivos || null,
                data.entregable_clave || null
            ]
        );
        return result;
    } catch (error) {
        console.error("Error creating sesion:", error);
        throw new Error('Error al crear la sesión del evento.');
    }
};

export const updateSesion = async (id: number, data: SesionEvento): Promise<OkPacket> => {
    try {
        const [result] = await dbPool.execute<OkPacket>(
            `UPDATE sesiones_evento SET
             dia_id = ?, horario_display = ?, hora_inicio = ?, hora_fin = ?,
             bloque_tematico = ?, foco_objetivos = ?, entregable_clave = ?
             WHERE sesion_id = ?`,
            [
                data.dia_id,
                data.horario_display,
                data.hora_inicio || null,
                data.hora_fin || null,
                data.bloque_tematico,
                data.foco_objetivos || null,
                data.entregable_clave || null,
                id
            ]
        );
        return result;
    } catch (error) {
        console.error(`Error updating sesion ${id}:`, error);
        throw new Error('Error al actualizar la sesión del evento.');
    }
};

export const deleteSesion = async (id: number): Promise<OkPacket> => {
     try {
        const [result] = await dbPool.execute<OkPacket>(
            'DELETE FROM sesiones_evento WHERE sesion_id = ?',
            [id]
        );
        return result;
    } catch (error) {
        console.error(`Error deleting sesion ${id}:`, error);
        throw new Error('Error al eliminar la sesión del evento.');
    }
};
// /backend/src/api/cronograma/cronograma.controller.ts
import { Request, Response } from 'express';
import * as cronogramaService from './cronograma.service';

// --- Controlador Público ---
export const getFullScheduleController = async (req: Request, res: Response) => {
    try {
        const schedule = await cronogramaService.getFullSchedule();
        res.status(200).json(schedule);
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Error al obtener el cronograma' });
    }
};

// --- Controladores Admin para Días ---
export const getAllDiasAdminController = async (req: Request, res: Response) => {
    try {
        const dias = await cronogramaService.getAllDiasAdmin();
        res.status(200).json(dias);
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Error al obtener días' });
    }
};

export const createDiaController = async (req: Request, res: Response) => {
    try {
        // Aquí podrías añadir validación con Zod si quieres
        const result = await cronogramaService.createDia(req.body);
        res.status(201).json({ message: 'Día creado exitosamente', diaId: result.insertId });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Error al crear día' });
    }
};

export const updateDiaController = async (req: Request, res: Response) => {
     try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) return res.status(400).json({ message: 'ID de día inválido' });
        const result = await cronogramaService.updateDia(id, req.body);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Día no encontrado' });
        res.status(200).json({ message: 'Día actualizado exitosamente' });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Error al actualizar día' });
    }
};

export const deleteDiaController = async (req: Request, res: Response) => {
     try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) return res.status(400).json({ message: 'ID de día inválido' });
        const result = await cronogramaService.deleteDia(id);
         if (result.affectedRows === 0) return res.status(404).json({ message: 'Día no encontrado' });
        res.status(200).json({ message: 'Día eliminado exitosamente' });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Error al eliminar día' });
    }
};

// --- Controladores Admin para Sesiones ---
export const getAllSesionesAdminController = async (req: Request, res: Response) => {
    try {
        const sesiones = await cronogramaService.getAllSesionesAdmin();
        res.status(200).json(sesiones);
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Error al obtener sesiones' });
    }
};

export const createSesionController = async (req: Request, res: Response) => {
     try {
        // Validación básica (podrías usar Zod)
        if (!req.body.dia_id || !req.body.horario_display || !req.body.bloque_tematico) {
             return res.status(400).json({ message: 'Faltan campos requeridos para la sesión.' });
        }
        const result = await cronogramaService.createSesion(req.body);
        res.status(201).json({ message: 'Sesión creada exitosamente', sesionId: result.insertId });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Error al crear sesión' });
    }
};

export const updateSesionController = async (req: Request, res: Response) => {
     try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) return res.status(400).json({ message: 'ID de sesión inválido' });
        const result = await cronogramaService.updateSesion(id, req.body);
         if (result.affectedRows === 0) return res.status(404).json({ message: 'Sesión no encontrada' });
        res.status(200).json({ message: 'Sesión actualizada exitosamente' });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Error al actualizar sesión' });
    }
};

export const deleteSesionController = async (req: Request, res: Response) => {
     try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) return res.status(400).json({ message: 'ID de sesión inválido' });
        const result = await cronogramaService.deleteSesion(id);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Sesión no encontrada' });
        res.status(200).json({ message: 'Sesión eliminada exitosamente' });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Error al eliminar sesión' });
    }
};
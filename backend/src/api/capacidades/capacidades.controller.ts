// /backend/src/api/capacidades/capacidades.controller.ts
import { Request, Response } from 'express';
import * as capacidadService from './capacidades.service';

export const createCapacidadController = async (req: Request, res: Response) => {
  try {
    if (!req.user || req.user.rol !== 'unsa' || !req.profileId) {
      return res.status(403).json({ message: 'Acción no permitida o perfil no encontrado.' });
    }

    const capacidadData = {
      ...req.body,
      investigador_id: req.profileId, // Usa el ID del perfil obtenido por el middleware
    };

    const result = await capacidadService.createCapacidad(capacidadData);
    res.status(201).json({ message: 'Capacidad registrada exitosamente', capacidadId: result.insertId });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error interno del servidor' });
  }
};

export const getMisCapacidadesController = async (req: Request, res: Response) => {
    try {
        if (!req.user || req.user.rol !== 'unsa' || !req.profileId) {
             return res.status(403).json({ message: 'Acción no permitida o perfil no encontrado.' });
        }
        const capacidades = await capacidadService.getCapacidadesByInvestigador(req.profileId);
        res.status(200).json(capacidades);
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Error al obtener capacidades' });
    }
};

// (Opcional: Controlador para admin)
export const getAllCapacidadesController = async (req: Request, res: Response) => {
     try {
        // Asegúrate de que solo el admin acceda (ya protegido por authorizeRole en rutas)
        const capacidades = await capacidadService.getAllCapacidades();
        res.status(200).json(capacidades);
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Error al obtener todas las capacidades' });
    }
}
// /backend/src/api/matching/matching.controller.ts
import { Request, Response } from 'express';
import * as matchingService from './matching.service';

/**
 * Controlador para obtener capacidades que coinciden con un desafío.
 */
export const getCapacidadMatchesController = async (req: Request, res: Response) => {
  try {
    const desafioId = parseInt(req.params.id, 10);
    if (isNaN(desafioId)) {
      return res.status(400).json({ message: 'ID de desafío inválido.' });
    }

    const matches = await matchingService.findCapacidadMatchesForDesafio(desafioId);
    res.status(200).json(matches);

  } catch (error: any) {
    console.error("Error en getCapacidadMatchesController:", error);
    res.status(500).json({ message: error.message || 'Error interno al buscar coincidencias de capacidad.' });
  }
};

/**
 * Controlador para obtener desafíos que coinciden con una capacidad.
 */
export const getDesafioMatchesController = async (req: Request, res: Response) => {
   try {
    const capacidadId = parseInt(req.params.id, 10);
    if (isNaN(capacidadId)) {
      return res.status(400).json({ message: 'ID de capacidad inválido.' });
    }

    const matches = await matchingService.findDesafioMatchesForCapacidad(capacidadId);
    res.status(200).json(matches);

  } catch (error: any) {
    console.error("Error en getDesafioMatchesController:", error);
    res.status(500).json({ message: error.message || 'Error interno al buscar coincidencias de desafío.' });
  }
};
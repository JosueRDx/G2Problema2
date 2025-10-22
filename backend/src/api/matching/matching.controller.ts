// /backend/src/api/matching/matching.controller.ts
import { Request, Response } from 'express';
import * as matchingService from './matching.service';
import {
  assertMatchSystemEnabled,
  getDesafioOwnerUserId,
  getCapacidadOwnerUserId,
} from '../matches/matches.service';

/**
 * Controlador para obtener capacidades que coinciden con un desafío.
 */
export const getCapacidadMatchesController = async (req: Request, res: Response) => {
  try {
    const desafioId = parseInt(req.params.id, 10);
    if (isNaN(desafioId)) {
      return res.status(400).json({ message: 'ID de desafío inválido.' });
    }

    await assertMatchSystemEnabled({ bypassForAdmin: true, userRole: req.user?.rol });

    if (req.user?.rol === 'externo') {
      const ownerId = await getDesafioOwnerUserId(desafioId);
      if (ownerId !== req.user.userId) {
        return res.status(403).json({ message: 'No puedes consultar coincidencias de un desafío que no te pertenece.' });
      }
    }

    const matches = await matchingService.findCapacidadMatchesForDesafio(desafioId);
    res.status(200).json(matches);

  } catch (error: any) {
    console.error("Error en getCapacidadMatchesController:", error);
    const statusCode = error.message === 'El sistema de matchs está desactivado.' ? 403 : 500;
    res.status(statusCode).json({ message: error.message || 'Error interno al buscar coincidencias de capacidad.' });
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

    await assertMatchSystemEnabled({ bypassForAdmin: true, userRole: req.user?.rol });

    if (req.user?.rol === 'unsa') {
      const ownerId = await getCapacidadOwnerUserId(capacidadId);
      if (ownerId !== req.user.userId) {
        return res.status(403).json({ message: 'No puedes consultar coincidencias de una capacidad que no te pertenece.' });
      }
    }

    const matches = await matchingService.findDesafioMatchesForCapacidad(capacidadId);
    res.status(200).json(matches);

  } catch (error: any) {
    console.error("Error en getDesafioMatchesController:", error);
    const statusCode = error.message === 'El sistema de matchs está desactivado.' ? 403 : 500;
    res.status(statusCode).json({ message: error.message || 'Error interno al buscar coincidencias de desafío.' });
  }
};
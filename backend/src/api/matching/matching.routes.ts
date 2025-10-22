// /backend/src/api/matching/matching.routes.ts
import { Router } from 'express';
import * as matchingController from './matching.controller';
import { authenticateToken, authorizeRole } from '../../middleware/authMiddleware';

const router = Router();

// Ruta para obtener capacidades que coinciden con un desafío específico
// GET /api/matches/desafio/:id
router.get(
  '/desafio/:id',
  authenticateToken,
  authorizeRole(['admin', 'externo']),
  matchingController.getCapacidadMatchesController
);

// Ruta para obtener desafíos que coinciden con una capacidad específica
// GET /api/matches/capacidad/:id
router.get(
  '/capacidad/:id',
  authenticateToken,
  authorizeRole(['admin', 'unsa']),
  matchingController.getDesafioMatchesController
);

export default router;
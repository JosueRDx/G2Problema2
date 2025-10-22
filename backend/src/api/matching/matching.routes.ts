// /backend/src/api/matching/matching.routes.ts
import { Router } from 'express';
import * as matchingController from './matching.controller';
import { authenticateToken, authorizeRole } from '../../middleware/authMiddleware';

const router = Router();

// Middleware para asegurar que solo los admins accedan a estas rutas
router.use(authenticateToken, authorizeRole(['admin']));

// Ruta para obtener capacidades que coinciden con un desafío específico
// GET /api/matches/desafio/:id
router.get('/desafio/:id', matchingController.getCapacidadMatchesController);

// Ruta para obtener desafíos que coinciden con una capacidad específica
// GET /api/matches/capacidad/:id
router.get('/capacidad/:id', matchingController.getDesafioMatchesController);

export default router;
import { Router } from 'express'; 
import * as matchesController from './matches.controller';
import { authenticateToken, authorizeRole } from '../../middleware/authMiddleware';

// Crea una nueva instancia de Router
const router = Router();

// --- Definición de Rutas para Matchs ---

/**
 * POST /api/matches
 */
router.post(
  '/', 
  authenticateToken, 
  matchesController.createMatchController 
);

/**
 * GET /api/matches/my
 */
router.get(
  '/my', 
  authenticateToken, 
  matchesController.getMyMatchesController
);

/**
 * PATCH /api/matches/:matchId/status
 */
router.patch( 
  '/:matchId/status', 
  authenticateToken, 
  matchesController.updateMatchStatusController 
);

/**
 * GET /api/matches/admin/all
 */
router.get(
  '/admin/all', 
  authenticateToken,
  authorizeRole(['admin']),
  matchesController.getAllMatchesAdminController
);

export default router;
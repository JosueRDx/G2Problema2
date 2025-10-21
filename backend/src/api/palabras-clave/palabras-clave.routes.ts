// /backend/src/api/palabras-clave/palabras-clave.routes.ts
import { Router } from 'express';
import * as keywordController from './palabras-clave.controller';
import { authenticateToken, authorizeRole } from '../../middleware/authMiddleware';

const router = Router();

// Obtener estadísticas (solo admin)
router.get(
    '/stats',
    authenticateToken,
    authorizeRole(['admin']),
    keywordController.getKeywordStatsController
);

export default router;
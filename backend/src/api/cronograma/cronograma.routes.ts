// /backend/src/api/cronograma/cronograma.routes.ts
import { Router } from 'express';
import * as cronogramaController from './cronograma.controller';
import { authenticateToken, authorizeRole } from '../../middleware/authMiddleware';

const router = Router();

// --- Ruta Pública ---
// GET /api/cronograma (Para la página /agenda)
router.get('/', cronogramaController.getFullScheduleController);

// --- Rutas Admin para Días ---
router.get(
    '/admin/dias',
    authenticateToken,
    authorizeRole(['admin']),
    cronogramaController.getAllDiasAdminController
);
router.post(
    '/admin/dias',
    authenticateToken,
    authorizeRole(['admin']),
    cronogramaController.createDiaController
);
router.put(
    '/admin/dias/:id',
    authenticateToken,
    authorizeRole(['admin']),
    cronogramaController.updateDiaController
);
router.delete(
    '/admin/dias/:id',
    authenticateToken,
    authorizeRole(['admin']),
    cronogramaController.deleteDiaController
);

// --- Rutas Admin para Sesiones ---
router.get(
    '/admin/sesiones',
    authenticateToken,
    authorizeRole(['admin']),
    cronogramaController.getAllSesionesAdminController
);
router.post(
    '/admin/sesiones',
    authenticateToken,
    authorizeRole(['admin']),
    cronogramaController.createSesionController
);
router.put(
    '/admin/sesiones/:id',
    authenticateToken,
    authorizeRole(['admin']),
    cronogramaController.updateSesionController
);
router.delete(
    '/admin/sesiones/:id',
    authenticateToken,
    authorizeRole(['admin']),
    cronogramaController.deleteSesionController
);

export default router;
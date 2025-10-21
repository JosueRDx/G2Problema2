// /backend/src/api/desafios/desafios.routes.ts
import { Router } from 'express';
import * as desafioController from './desafios.controller';
import { authenticateToken, authorizeRole } from '../../middleware/authMiddleware';
import upload from '../../middleware/uploadMiddleware'; // <-- IMPORTA MULTER

const router = Router();

// Crear desafío (solo rol 'externo')
router.post(
  '/',
  authenticateToken,       // 1. Verifica token y obtiene user/profileId
  authorizeRole(['externo']), // 2. Verifica rol
  upload.single('adjunto'), // 3. MULTER: Procesa el archivo 'adjunto' y pone campos de texto en req.body
  desafioController.createDesafioController // 4. El controlador ahora tiene req.body poblado
);

// Obtener desafíos del participante logueado (solo rol 'externo')
router.get(
    '/mis-desafios',
    authenticateToken,
    authorizeRole(['externo']),
    desafioController.getMisDesafiosController
);

// Obtener todos los desafíos (solo rol 'admin')
router.get(
    '/',
    authenticateToken,
    authorizeRole(['admin']),
    desafioController.getAllDesafiosController
);


export default router;
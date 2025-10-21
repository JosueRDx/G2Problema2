import { Router } from 'express';
import * as authController from './auth.controller';

const router = Router();

// POST /api/auth/register
router.post('/register', authController.registerUser);

// POST /api/auth/login
router.post('/login', authController.loginUser);

// GET /api/auth/verify
router.get('/verify', authController.verifyToken);

export default router;
// /backend/src/api/users/users.routes.ts
import { Router } from 'express';
import { getUsers, exportUsersCSV } from './users.controller';
import { authenticateToken, authorizeRole } from '../../middleware/authMiddleware';

const router = Router();

router.get('/', authenticateToken, authorizeRole(['admin']), getUsers);
router.get('/export', authenticateToken, authorizeRole(['admin']), exportUsersCSV);

export default router;

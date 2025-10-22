// /backend/src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { env } from '../config/env';
import dbPool from '../config/db'; // Needed to get profile ID
import { RowDataPacket } from 'mysql2';

// Extiende la interfaz Request para añadir la propiedad user y profileId
declare global {
  namespace Express {
    interface Request {
      user?: { userId: number; rol: string };
      profileId?: number; // ID del participante o investigador
    }
  }
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.status(401).json({ message: 'Token no proporcionado.' });

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { userId: number; rol: string };
    req.user = payload; // Guarda el payload básico

    // Obtener el ID del perfil específico (participante_id o investigador_id)
    let profileIdResult: RowDataPacket[] = [];
    if (req.user.rol === 'externo') {
      [profileIdResult] = await dbPool.execute<RowDataPacket[]>(
        'SELECT participante_id FROM Participantes_Externos WHERE usuario_id = ?',
        [req.user.userId]
      );
      if (profileIdResult.length > 0) {
        req.profileId = profileIdResult[0].participante_id;
      }
    } else if (req.user.rol === 'unsa') {
      [profileIdResult] = await dbPool.execute<RowDataPacket[]>(
        'SELECT investigador_id FROM Investigadores_UNSA WHERE usuario_id = ?',
        [req.user.userId]
      );
       if (profileIdResult.length > 0) {
        req.profileId = profileIdResult[0].investigador_id;
      }
    }
     // Si es admin, req.profileId quedará undefined, lo cual está bien si no lo necesita

    if ((req.user.rol === 'externo' || req.user.rol === 'unsa') && !req.profileId) {
       console.warn(`No se encontró perfil para usuario_id: ${req.user.userId} con rol ${req.user.rol}`);
       // Considera si esto debe ser un error 403 o si la ruta puede manejarlo
       // return res.status(403).json({ message: 'Perfil de usuario no encontrado.' });
    }


    next(); // Pasa al siguiente middleware o controlador
  } catch (err) {
    console.error("Error al verificar token:", err);
    return res.status(403).json({ message: 'Token inválido o expirado.' });
  }
};

// Middleware específico para roles (opcional pero útil)
export const authorizeRole = (allowedRoles: string[]) => {
   return (req: Request, res: Response, next: NextFunction) => {
       if (!req.user || !allowedRoles.includes(req.user.rol)) {
           return res.status(403).json({ message: 'Acceso denegado para este rol.' });
       }
       next();
   };
};


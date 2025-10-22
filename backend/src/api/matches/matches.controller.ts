// /backend/src/api/matches/matches.controller.ts
import { Request, Response } from 'express';
import * as matchesService from './matches.service';
import { MatchEstado } from './matches.service';
import dbPool from '../../config/db'; 
import { RowDataPacket } from 'mysql2/promise'; 

async function getDesafioOwnerId(desafio_id: number): Promise<number | null> {
    console.warn(`Función getDesafioOwnerId(${desafio_id}) usando implementación directa de BD`);
    try {
        const [rows] = await dbPool.execute<RowDataPacket[]>(
            `SELECT p.usuario_id
             FROM desafios d
             JOIN participantes_externos p ON d.participante_id = p.participante_id
             WHERE d.desafio_id = ?`,
            [desafio_id]
        );
        return rows.length > 0 ? rows[0].usuario_id : null;
    } catch (error) {
        console.error(`Error en getDesafioOwnerId(${desafio_id}):`, error);
        return null; // Devuelve null en caso de error de BD
    }
}

async function getCapacidadOwnerId(capacidad_id: number): Promise<number | null> {
    console.warn(`Función getCapacidadOwnerId(${capacidad_id}) usando implementación directa de BD`);
     try {
        const [rows] = await dbPool.execute<RowDataPacket[]>(
            `SELECT i.usuario_id
             FROM capacidades_unsa c
             JOIN investigadores_unsa i ON c.investigador_id = i.investigador_id
             WHERE c.capacidad_id = ?`,
            [capacidad_id]
        );
        return rows.length > 0 ? rows[0].usuario_id : null;
     } catch (error) {
        console.error(`Error en getCapacidadOwnerId(${capacidad_id}):`, error);
        return null; // Devuelve null en caso de error de BD
    }
}

/**
 * Controlador para CREAR una nueva solicitud de match.
 */
export const createMatchController = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Autenticación requerida.' });
  }
  const { desafio_id, capacidad_id } = req.body;
  const solicitante_usuario_id = req.user.userId;

  if (!desafio_id || !capacidad_id || typeof desafio_id !== 'number' || typeof capacidad_id !== 'number') {
    return res.status(400).json({ message: 'IDs de desafío o capacidad inválidos.' });
  }

  try {
    let receptor_usuario_id: number | null = null;
    let estado_inicial: 'pendiente_unsa' | 'pendiente_externo';

    if (req.user.rol === 'externo') {
      receptor_usuario_id = await getCapacidadOwnerId(capacidad_id);
      if (!receptor_usuario_id) throw new Error('No se encontró el investigador dueño de la capacidad.');
      const desafioOwner = await getDesafioOwnerId(desafio_id);
      if (desafioOwner !== solicitante_usuario_id) {
           return res.status(403).json({ message: 'No puedes iniciar un match con un desafío que no te pertenece.' });
      }
      estado_inicial = 'pendiente_unsa';

    } else if (req.user.rol === 'unsa') {
      receptor_usuario_id = await getDesafioOwnerId(desafio_id);
      if (!receptor_usuario_id) throw new Error('No se encontró el participante dueño del desafío.');
       const capacidadOwner = await getCapacidadOwnerId(capacidad_id);
       if (capacidadOwner !== solicitante_usuario_id) {
            return res.status(403).json({ message: 'No puedes iniciar un match con una capacidad que no te pertenece.' });
       }
      estado_inicial = 'pendiente_externo';

    } else {
      return res.status(403).json({ message: 'Rol no autorizado para crear matchs.' });
    }

    // Asegurarse de que el receptor_usuario_id no sea null aquí
     if (receptor_usuario_id === null) {
          throw new Error('No se pudo determinar el receptor del match.'); 
     }


    const matchData: matchesService.CreateMatchData = {
      desafio_id,
      capacidad_id,
      solicitante_usuario_id,
      receptor_usuario_id, 
      estado_inicial,
    };

    const newMatchId = await matchesService.createMatch(matchData);
    res.status(201).json({ message: 'Solicitud de match creada exitosamente.', matchId: newMatchId });

  } catch (error: any) {
    console.error("Error en createMatchController:", error);
    res.status(error.message.includes('Ya existe') || error.message.includes('no existe') || error.message.includes('No se encontró') ? 400 : 500)
       .json({ message: error.message || 'Error interno al procesar la solicitud.' });
  }
};

/**
 * Controlador para OBTENER los matchs del usuario autenticado.
 */
export const getMyMatchesController = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Autenticación requerida.' });
  }
  try {
    const matchs = await matchesService.getMatchesByUser(req.user.userId);
    res.status(200).json(matchs);
  } catch (error: any) {
    console.error("Error en getMyMatchesController:", error);
    res.status(500).json({ message: error.message || 'Error al obtener tus matchs.' });
  }
};

/**
 * Controlador para ACTUALIZAR el estado de un match (Aceptar, Rechazar, Cancelar).
 */
export const updateMatchStatusController = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Autenticación requerida.' });
  }
  const match_id = parseInt(req.params.matchId, 10);
  const { accion } = req.body;

  if (isNaN(match_id)) {
    return res.status(400).json({ message: 'ID de match inválido.' });
  }
  if (!['aceptar', 'rechazar', 'cancelar'].includes(accion)) {
    return res.status(400).json({ message: 'Acción inválida. Debe ser aceptar, rechazar o cancelar.' });
  }

  try {
    const currentMatch = await matchesService.getMatchById(match_id);
    if (!currentMatch) {
      return res.status(404).json({ message: 'Match no encontrado.' });
    }

    const userId = req.user.userId;
    const userRol = req.user.rol;
    let nuevo_estado: MatchEstado | null = null;

    switch (accion) {
      case 'aceptar':
        if (userId === currentMatch.receptor_usuario_id) {
          if ((currentMatch.estado === 'pendiente_unsa' && userRol === 'unsa') || (currentMatch.estado === 'pendiente_externo' && userRol === 'externo')) {
            nuevo_estado = 'aceptado';
          } else {
             return res.status(403).json({ message: 'No puedes aceptar este match en su estado actual.' });
          }
        } else {
          return res.status(403).json({ message: 'No eres el receptor de esta solicitud para aceptarla.' });
        }
        break;
      case 'rechazar':
         if (userId === currentMatch.receptor_usuario_id) {
          if (currentMatch.estado === 'pendiente_unsa' && userRol === 'unsa') {
            nuevo_estado = 'rechazado_unsa';
          } else if (currentMatch.estado === 'pendiente_externo' && userRol === 'externo') {
            nuevo_estado = 'rechazado_externo';
          } else {
             return res.status(403).json({ message: 'No puedes rechazar este match en su estado actual.' });
          }
        } else {
          return res.status(403).json({ message: 'No eres el receptor de esta solicitud para rechazarla.' });
        }
        break;
      case 'cancelar':
        if (userId === currentMatch.solicitante_usuario_id) {
           if (currentMatch.estado === 'pendiente_unsa' || currentMatch.estado === 'pendiente_externo') {
                nuevo_estado = 'cancelado';
           } else {
                return res.status(403).json({ message: 'No puedes cancelar un match que ya fue respondido o cancelado.' });
           }
        } else {
           return res.status(403).json({ message: 'No eres quien inició esta solicitud para cancelarla.' });
        }
        break;
    }

    if (nuevo_estado) {
      const affectedRows = await matchesService.updateMatchEstado(match_id, nuevo_estado);
      if (affectedRows > 0) {
        res.status(200).json({ message: `Match ${accion === 'aceptar' ? 'aceptado' : (accion === 'rechazar' ? 'rechazado' : 'cancelado')} correctamente.` });
      } else {
         res.status(404).json({ message: 'Match no encontrado al intentar actualizar.' });
      }
    } else {
       console.warn("No se determinó un nuevo estado válido para el match", match_id, "con acción", accion);
    }

  } catch (error: any) {
    console.error("Error en updateMatchStatusController:", error);
    res.status(500).json({ message: error.message || 'Error interno al actualizar el estado del match.' });
  }
};

/**
 * Controlador para OBTENER TODOS los matchs (SOLO ADMIN).
 */
export const getAllMatchesAdminController = async (req: Request, res: Response) => {
    if (!req.user || req.user.rol !== 'admin') {
        return res.status(403).json({ message: 'Acceso denegado.' });
    }
    try {
        const matchs = await matchesService.getAllMatchesAdmin();
        res.status(200).json(matchs);
    } catch (error: any) {
        console.error("Error en getAllMatchesAdminController:", error);
        res.status(500).json({ message: error.message || 'Error al obtener todos los matchs.' });
    }
};
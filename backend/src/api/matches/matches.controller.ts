import { Request, Response } from 'express';
import * as matchesService from './matches.service';
import {
  MatchEstado,
  assertMatchSystemEnabled,
  getCapacidadOwnerUserId,
  getDesafioOwnerUserId,
  ensureUserCanAccessMatch,
} from './matches.service';

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
    await assertMatchSystemEnabled({ userRole: req.user.rol });
    let receptor_usuario_id: number | null = null;
    let estado_inicial: 'pendiente_unsa' | 'pendiente_externo';

    if (req.user.rol === 'externo') {
      receptor_usuario_id = await getCapacidadOwnerUserId(capacidad_id);
      if (!receptor_usuario_id) throw new Error('No se encontró el investigador dueño de la capacidad.');
      const desafioOwner = await getDesafioOwnerUserId(desafio_id);
      if (desafioOwner !== solicitante_usuario_id) {
           return res.status(403).json({ message: 'No puedes iniciar un match con un desafío que no te pertenece.' });
      }
      estado_inicial = 'pendiente_unsa';

    } else if (req.user.rol === 'unsa') {
      receptor_usuario_id = await getDesafioOwnerUserId(desafio_id);
      if (!receptor_usuario_id) throw new Error('No se encontró el participante dueño del desafío.');
       const capacidadOwner = await getCapacidadOwnerUserId(capacidad_id);
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
    const statusCode =
      error.message === 'El sistema de matchs está desactivado.'
        ? 403
        : error.message.includes('Ya existe') || error.message.includes('no existe') || error.message.includes('No se encontró')
        ? 400
        : 500;
    res
      .status(statusCode)
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
    await assertMatchSystemEnabled({ userRole: req.user.rol });
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
    const statusCode =
      error.message === 'El sistema de matchs está desactivado.'
        ? 403
        : error.message === 'Match no encontrado.'
        ? 404
        : error.message.includes('No puedes')
        ? 403
        : 500;
    res.status(statusCode).json({ message: error.message || 'Error interno al actualizar el estado del match.' });
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

export const getMatchSystemStatusController = async (_req: Request, res: Response) => {
  try {
    const enabled = await matchesService.getMatchSystemStatus();
    res.status(200).json({ enabled });
  } catch (error: any) {
    console.error('Error en getMatchSystemStatusController:', error);
    res.status(500).json({ message: error.message || 'No se pudo obtener el estado del sistema de matchs.' });
  }
};

export const updateMatchSystemStatusController = async (req: Request, res: Response) => {
  if (!req.user || req.user.rol !== 'admin') {
    return res.status(403).json({ message: 'Acceso denegado.' });
  }

  const { enabled } = req.body;

  if (typeof enabled !== 'boolean') {
    return res.status(400).json({ message: 'El valor "enabled" debe ser booleano.' });
  }

  try {
    await matchesService.updateMatchSystemStatus(enabled);
    res.status(200).json({ message: 'Estado del sistema de matchs actualizado correctamente.', enabled });
  } catch (error: any) {
    console.error('Error en updateMatchSystemStatusController:', error);
    res.status(500).json({ message: error.message || 'No se pudo actualizar el estado del sistema de matchs.' });
  }
};

export const getMatchMessagesController = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Autenticación requerida.' });
  }

  const match_id = parseInt(req.params.matchId, 10);
  if (isNaN(match_id)) {
    return res.status(400).json({ message: 'ID de match inválido.' });
  }

  try {
    await assertMatchSystemEnabled({ userRole: req.user.rol });
    await ensureUserCanAccessMatch(match_id, req.user.userId, { requireAccepted: true });
    const messages = await matchesService.getMessagesByMatchId(match_id);
    res.status(200).json(messages);
  } catch (error: any) {
    console.error('Error en getMatchMessagesController:', error);
    const statusCode =
      error.message === 'El sistema de matchs está desactivado.'
        ? 403
        : error.message === 'Match no encontrado.'
        ? 404
        : error.message.includes('No tienes acceso') || error.message.includes('disponible')
        ? 403
        : 500;
    res.status(statusCode).json({ message: error.message || 'Error al obtener los mensajes.' });
  }
};

export const createMatchMessageController = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Autenticación requerida.' });
  }

  const match_id = parseInt(req.params.matchId, 10);
  const { contenido } = req.body;

  if (isNaN(match_id)) {
    return res.status(400).json({ message: 'ID de match inválido.' });
  }
  if (!contenido || typeof contenido !== 'string') {
    return res.status(400).json({ message: 'El contenido del mensaje es obligatorio.' });
  }

  try {
    await assertMatchSystemEnabled({ userRole: req.user.rol });
    await ensureUserCanAccessMatch(match_id, req.user.userId, { requireAccepted: true });
    const messageId = await matchesService.createMatchMessage(match_id, req.user.userId, contenido.trim());
    res.status(201).json({ message: 'Mensaje enviado correctamente.', messageId });
  } catch (error: any) {
    console.error('Error en createMatchMessageController:', error);
    const statusCode =
      error.message === 'El sistema de matchs está desactivado.'
        ? 403
        : error.message === 'Match no encontrado.'
        ? 404
        : error.message.includes('No tienes acceso') || error.message.includes('disponible')
        ? 403
        : 500;
    res.status(statusCode).json({ message: error.message || 'Error al enviar el mensaje.' });
  }
};

export const markMessagesAsReadController = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Autenticación requerida.' });
  }

  const match_id = parseInt(req.params.matchId, 10);

  if (isNaN(match_id)) {
    return res.status(400).json({ message: 'ID de match inválido.' });
  }

  try {
    await assertMatchSystemEnabled({ userRole: req.user.rol });
    await ensureUserCanAccessMatch(match_id, req.user.userId, { requireAccepted: true });
    const affected = await matchesService.markMessagesAsRead(match_id, req.user.userId);
    res.status(200).json({ message: 'Mensajes marcados como leídos.', updated: affected });
  } catch (error: any) {
    console.error('Error en markMessagesAsReadController:', error);
    const statusCode =
      error.message === 'El sistema de matchs está desactivado.'
        ? 403
        : error.message === 'Match no encontrado.'
        ? 404
        : error.message.includes('No tienes acceso') || error.message.includes('disponible')
        ? 403
        : 500;
    res.status(statusCode).json({ message: error.message || 'Error al actualizar los mensajes.' });
  }
};
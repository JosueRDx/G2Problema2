import dbPool from '../../config/db';
import { RowDataPacket, OkPacket } from 'mysql2/promise';

const MATCH_SETTINGS_KEY = 'matchs_enabled';

// Define los posibles estados de un match (igual que en la base de datos)
export type MatchEstado =
  | 'pendiente_unsa'
  | 'pendiente_externo'
  | 'aceptado'
  | 'rechazado_unsa'
  | 'rechazado_externo'
  | 'cancelado';

// Define la estructura de datos que esperamos al crear un match
export interface CreateMatchData {
  desafio_id: number;
  capacidad_id: number;
  solicitante_usuario_id: number; 
  receptor_usuario_id: number;    
  estado_inicial: 'pendiente_unsa' | 'pendiente_externo'; 
}

// Define la estructura de un registro de Match como viene de la BD (puede incluir más campos)
export interface MatchRecord extends RowDataPacket {
  match_id: number;
  desafio_id: number;
  capacidad_id: number;
  solicitante_usuario_id: number;
  receptor_usuario_id: number;
  estado: MatchEstado;
  fecha_creacion: string; 
  fecha_actualizacion: string; 
  // Campos adicionales de los JOINs para mostrar información útil
  desafio_titulo?: string;
  capacidad_desc_corta?: string; 
  solicitante_nombre?: string;
  receptor_nombre?: string;
  desafio_participante_nombre?: string; 
  capacidad_investigador_nombre?: string;
}

export interface MatchSettingsRow extends RowDataPacket {
  clave: string;
  valor: string;
}

export interface MatchMessage extends RowDataPacket {
  mensaje_id: number;
  match_id: number;
  remitente_usuario_id: number;
  contenido: string;
  fecha_envio: string;
  leido: number;
  remitente_email?: string;
  remitente_nombre?: string | null;
}

const parseEnabledFlag = (valor: string | undefined): boolean => valor === '1' || valor === 'true';

export const getMatchSystemStatus = async (): Promise<boolean> => {
  try {
    const [rows] = await dbPool.execute<MatchSettingsRow[]>(
      'SELECT valor FROM configuracion_sistema WHERE clave = ? LIMIT 1',
      [MATCH_SETTINGS_KEY]
    );

    if (!rows.length) {
      return false;
    }

    return parseEnabledFlag(rows[0].valor);
  } catch (error: any) {
    if (error?.code === 'ER_NO_SUCH_TABLE') {
      console.warn('Tabla configuracion_sistema no encontrada. Se asume sistema de matchs deshabilitado.');
      return false;
    }
    console.error('Error al obtener el estado del sistema de matchs:', error);
    throw new Error('No se pudo obtener el estado del sistema de matchs.');
  }
};

export const updateMatchSystemStatus = async (enabled: boolean): Promise<void> => {
  try {
    await dbPool.execute(
      `INSERT INTO configuracion_sistema (clave, valor)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE valor = VALUES(valor)`,
      [MATCH_SETTINGS_KEY, enabled ? '1' : '0']
    );
  } catch (error: any) {
    if (error?.code === 'ER_NO_SUCH_TABLE') {
      console.error('Debe existir la tabla configuracion_sistema con la columna clave como PRIMARY KEY.');
    } else {
      console.error('Error al actualizar el estado del sistema de matchs:', error);
    }
    throw new Error('No se pudo actualizar el estado del sistema de matchs.');
  }
};

export const assertMatchSystemEnabled = async (options?: { bypassForAdmin?: boolean; userRole?: string }): Promise<void> => {
  if (options?.bypassForAdmin && options.userRole === 'admin') {
    return;
  }

  const enabled = await getMatchSystemStatus();
  if (!enabled) {
    throw new Error('El sistema de matchs está desactivado.');
  }
};

export const getDesafioOwnerUserId = async (desafio_id: number): Promise<number | null> => {
  try {
    const [rows] = await dbPool.execute<RowDataPacket[]>(
      `SELECT p.usuario_id
       FROM desafios d
       JOIN participantes_externos p ON d.participante_id = p.participante_id
       WHERE d.desafio_id = ?`,
      [desafio_id]
    );
    return rows.length ? (rows[0].usuario_id as number) : null;
  } catch (error) {
    console.error(`Error al obtener el dueño del desafío ${desafio_id}:`, error);
    throw new Error('No se pudo validar el propietario del desafío.');
  }
};

export const getCapacidadOwnerUserId = async (capacidad_id: number): Promise<number | null> => {
  try {
    const [rows] = await dbPool.execute<RowDataPacket[]>(
      `SELECT i.usuario_id
       FROM capacidades_unsa c
       JOIN investigadores_unsa i ON c.investigador_id = i.investigador_id
       WHERE c.capacidad_id = ?`,
      [capacidad_id]
    );
    return rows.length ? (rows[0].usuario_id as number) : null;
  } catch (error) {
    console.error(`Error al obtener el dueño de la capacidad ${capacidad_id}:`, error);
    throw new Error('No se pudo validar el propietario de la capacidad.');
  }
};

export const getMatchOrThrow = async (match_id: number): Promise<MatchRecord> => {
  const match = await getMatchById(match_id);
  if (!match) {
    throw new Error('Match no encontrado.');
  }
  return match;
};

export const ensureUserCanAccessMatch = async (
  match_id: number,
  usuario_id: number,
  options?: { requireAccepted?: boolean }
): Promise<MatchRecord> => {
  const match = await getMatchOrThrow(match_id);

  if (match.solicitante_usuario_id !== usuario_id && match.receptor_usuario_id !== usuario_id) {
    throw new Error('No tienes acceso a este match.');
  }

  if (options?.requireAccepted && match.estado !== 'aceptado') {
    throw new Error('El chat solo está disponible para matchs aceptados.');
  }

  return match;
};

/**
 * Función para crear un nuevo registro de match en la base de datos.
 */
export const createMatch = async (data: CreateMatchData): Promise<number> => {
  try {
    // Ejecuta la consulta SQL para insertar un nuevo match
    const [result] = await dbPool.execute<OkPacket>(
      `INSERT INTO matchs (desafio_id, capacidad_id, solicitante_usuario_id, receptor_usuario_id, estado, fecha_creacion, fecha_actualizacion)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        data.desafio_id,
        data.capacidad_id,
        data.solicitante_usuario_id,
        data.receptor_usuario_id,
        data.estado_inicial, 
      ]
    );

    // Verifica si la inserción fue exitosa y devuelve el ID
    if (result.insertId) {
      return result.insertId;
    } else {
      // Si no se obtuvo un ID, lanza un error
      throw new Error('No se pudo crear el match, no se obtuvo ID.');
    }
  } catch (error: any) {
    // Manejo de errores específicos de la base de datos
    if (error.code === 'ER_DUP_ENTRY') {
      throw new Error('Ya existe una solicitud de match entre este desafío y capacidad.');
    }
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
       throw new Error('El desafío, capacidad o usuario referenciado no existe.');
    }
    console.error('Error al crear match en la base de datos:', error);
    throw new Error('Error interno al intentar crear el match.');
  }
};

/**
 * Función para obtener los matchs en los que participa un usuario específico.
 */
export const getMatchesByUser = async (usuario_id: number): Promise<MatchRecord[]> => {
  try {
    // Consulta SQL compleja que une varias tablas para obtener información útil
    const query = `
      SELECT
          m.*,
          d.titulo AS desafio_titulo,
          SUBSTRING(cu.descripcion_capacidad, 1, 100) AS capacidad_desc_corta, -- Descripción corta
          solicitante.email AS solicitante_email, -- Podríamos unir con perfiles para nombres
          receptor.email AS receptor_email,       -- Podríamos unir con perfiles para nombres
          pe.nombres_apellidos AS desafio_participante_nombre,
          iu.nombres_apellidos AS capacidad_investigador_nombre
      FROM matchs m
      JOIN desafios d ON m.desafio_id = d.desafio_id
      JOIN capacidades_unsa cu ON m.capacidad_id = cu.capacidad_id
      JOIN usuarios solicitante ON m.solicitante_usuario_id = solicitante.usuario_id
      JOIN usuarios receptor ON m.receptor_usuario_id = receptor.usuario_id
      LEFT JOIN participantes_externos pe ON d.participante_id = pe.participante_id -- Dueño desafío
      LEFT JOIN investigadores_unsa iu ON cu.investigador_id = iu.investigador_id -- Dueño capacidad
      WHERE m.solicitante_usuario_id = ? OR m.receptor_usuario_id = ?
      ORDER BY m.fecha_actualizacion DESC; -- Ordena por la actualización más reciente primero
    `;
    // Ejecuta la consulta pasando el ID del usuario dos veces (para solicitante O receptor)
    const [rows] = await dbPool.query<MatchRecord[]>(query, [usuario_id, usuario_id]);
    return rows;
  } catch (error) {
    // Loguea y lanza error si falla la consulta
    console.error(`Error al obtener matchs para usuario ${usuario_id}:`, error);
    throw new Error('Error al obtener los matchs del usuario.');
  }
};

/**
 * Función para obtener UN match específico por su ID.
 */
export const getMatchById = async (match_id: number): Promise<MatchRecord | null> => {
    try {
        const [rows] = await dbPool.execute<MatchRecord[]>(
            'SELECT * FROM matchs WHERE match_id = ?',
            [match_id]
        );
        // Si encuentra una fila, la devuelve, si no, devuelve null
        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        console.error(`Error al obtener match ${match_id}:`, error);
        throw new Error('Error al obtener el detalle del match.');
    }
};


/**
 * Función para actualizar el estado de un match existente.
 */
export const updateMatchEstado = async (match_id: number, nuevo_estado: MatchEstado): Promise<number> => {
  try {
    // Ejecuta la consulta para actualizar el estado del match con el ID dado
    // La columna 'fecha_actualizacion' se actualiza automáticamente por la definición de la tabla
    const [result] = await dbPool.execute<OkPacket>(
      'UPDATE matchs SET estado = ? WHERE match_id = ?',
      [nuevo_estado, match_id]
    );
    // Devuelve cuántas filas fueron modificadas
    return result.affectedRows;
  } catch (error) {
    console.error(`Error al actualizar estado del match ${match_id}:`, error);
    throw new Error('Error al actualizar el estado del match.');
  }
};

/**
 * Función para obtener TODOS los matchs (SOLO PARA ADMIN).
 */
export const getAllMatchesAdmin = async (): Promise<MatchRecord[]> => {
  try {
    const query = `
      SELECT
          m.*,
          d.titulo AS desafio_titulo,
          SUBSTRING(cu.descripcion_capacidad, 1, 100) AS capacidad_desc_corta,
          solicitante.email AS solicitante_email,
          receptor.email AS receptor_email,
          pe.nombres_apellidos AS desafio_participante_nombre,
          iu.nombres_apellidos AS capacidad_investigador_nombre
      FROM matchs m
      JOIN desafios d ON m.desafio_id = d.desafio_id
      JOIN capacidades_unsa cu ON m.capacidad_id = cu.capacidad_id
      JOIN usuarios solicitante ON m.solicitante_usuario_id = solicitante.usuario_id
      JOIN usuarios receptor ON m.receptor_usuario_id = receptor.usuario_id
      LEFT JOIN participantes_externos pe ON d.participante_id = pe.participante_id
      LEFT JOIN investigadores_unsa iu ON cu.investigador_id = iu.investigador_id
      ORDER BY m.fecha_actualizacion DESC;
    `;
    const [rows] = await dbPool.query<MatchRecord[]>(query);
    return rows;
  } catch (error) {
    console.error('Error al obtener todos los matchs para admin:', error);
    throw new Error('Error al obtener todos los matchs.');
  }
};

export const getMessagesByMatchId = async (match_id: number): Promise<MatchMessage[]> => {
  try {
    const [rows] = await dbPool.execute<MatchMessage[]>(
      `SELECT msj.*, u.email AS remitente_email, u.nombres_apellidos AS remitente_nombre
       FROM mensajes msj
       JOIN usuarios u ON msj.remitente_usuario_id = u.usuario_id
       WHERE msj.match_id = ?
       ORDER BY msj.fecha_envio ASC`,
      [match_id]
    );
    return rows;
  } catch (error) {
    console.error(`Error al obtener mensajes del match ${match_id}:`, error);
    throw new Error('Error al obtener los mensajes del match.');
  }
};

export const createMatchMessage = async (
  match_id: number,
  remitente_usuario_id: number,
  contenido: string
): Promise<number> => {
  try {
    const [result] = await dbPool.execute<OkPacket>(
      `INSERT INTO mensajes (match_id, remitente_usuario_id, contenido, fecha_envio, leido)
       VALUES (?, ?, ?, NOW(), 0)`,
      [match_id, remitente_usuario_id, contenido]
    );

    if (!result.insertId) {
      throw new Error('No se pudo registrar el mensaje.');
    }

    return result.insertId;
  } catch (error) {
    console.error(`Error al registrar mensaje para match ${match_id}:`, error);
    throw new Error('Error al enviar el mensaje.');
  }
};

export const markMessagesAsRead = async (match_id: number, usuario_id: number): Promise<number> => {
  try {
    const [result] = await dbPool.execute<OkPacket>(
      `UPDATE mensajes
       SET leido = 1
       WHERE match_id = ? AND remitente_usuario_id <> ? AND leido = 0`,
      [match_id, usuario_id]
    );
    return result.affectedRows;
  } catch (error) {
    console.error(`Error al marcar mensajes como leídos para match ${match_id}:`, error);
    throw new Error('Error al actualizar los mensajes como leídos.');
  }
};
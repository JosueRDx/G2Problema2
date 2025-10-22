import dbPool from '../../config/db'; 
import { RowDataPacket, OkPacket } from 'mysql2/promise'; 

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
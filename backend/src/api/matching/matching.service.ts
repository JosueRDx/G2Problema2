// /backend/src/api/matching/matching.service.ts
import dbPool from '../../config/db';
import { RowDataPacket } from 'mysql2/promise';

// Interfaz para describir un resultado de match (Capacidad encontrada para un Desafío)
export interface CapacidadMatch extends RowDataPacket {
  capacidad_id: number;
  descripcion_capacidad: string;
  investigador_nombre: string | null;
  palabras_coincidentes: string; // Palabras clave que coincidieron (separadas por coma)
  total_coincidencias: number; // Número de palabras clave coincidentes
}

// Interfaz para describir un resultado de match (Desafío encontrado para una Capacidad)
export interface DesafioMatch extends RowDataPacket {
  desafio_id: number;
  titulo: string;
  participante_nombre: string | null;
  organizacion: string | null;
  palabras_coincidentes: string; // Palabras clave que coincidieron (separadas por coma)
  total_coincidencias: number; // Número de palabras clave coincidentes
}

/**
 * Encuentra Capacidades que coinciden con las palabras clave de un Desafío específico.
 * Ordena por el número de palabras clave coincidentes (más coincidencias primero).
 * @param desafioId ID del Desafío para buscar coincidencias.
 * @returns Una promesa que resuelve a un array de CapacidadMatch.
 */
export const findCapacidadMatchesForDesafio = async (desafioId: number): Promise<CapacidadMatch[]> => {
  if (!desafioId || typeof desafioId !== 'number' || !Number.isInteger(desafioId) || desafioId <= 0) {
    throw new Error('ID de desafío inválido.');
  }

  try {
    // Consulta SQL principal para encontrar coincidencias
    const query = `
      SELECT
          c.capacidad_id,
          c.descripcion_capacidad,
          i.nombres_apellidos AS investigador_nombre,
          -- Agrupa las palabras clave EXACTAS que coincidieron
          GROUP_CONCAT(DISTINCT pc.palabra ORDER BY pc.palabra SEPARATOR ', ') AS palabras_coincidentes,
          -- Cuenta cuántas palabras clave únicas coincidieron
          COUNT(DISTINCT pc.palabra_clave_id) AS total_coincidencias
      FROM Desafios_PalabrasClave dpc
      -- Une con Capacidades_PalabrasClave a través de la palabra clave
      JOIN Capacidades_PalabrasClave cpc ON dpc.palabra_clave_id = cpc.palabra_clave_id
      -- Une con la tabla PalabrasClave para obtener el texto de la palabra
      JOIN PalabrasClave pc ON dpc.palabra_clave_id = pc.palabra_clave_id
      -- Une con la tabla Capacidades_UNSA para obtener detalles de la capacidad
      JOIN Capacidades_UNSA c ON cpc.capacidad_id = c.capacidad_id
      -- Une con la tabla Investigadores_UNSA para obtener el nombre del investigador
      LEFT JOIN Investigadores_UNSA i ON c.investigador_id = i.investigador_id
      WHERE dpc.desafio_id = ? -- Filtra por el desafío específico
      GROUP BY c.capacidad_id -- Agrupa por capacidad para contar coincidencias por capacidad
      ORDER BY total_coincidencias DESC, c.capacidad_id ASC; -- Ordena por relevancia (más coincidencias primero)
    `;

    const [rows] = await dbPool.execute<CapacidadMatch[]>(query, [desafioId]);
    console.log(`Encontradas ${rows.length} capacidades coincidentes para desafío ${desafioId}`);
    return rows;

  } catch (error: any) {
    console.error(`Error al buscar matches de capacidad para desafío ${desafioId}:`, error);
    throw new Error('Error al buscar capacidades coincidentes.');
  }
};

/**
 * Encuentra Desafíos que coinciden con las palabras clave de una Capacidad específica.
 * Ordena por el número de palabras clave coincidentes (más coincidencias primero).
 * @param capacidadId ID de la Capacidad para buscar coincidencias.
 * @returns Una promesa que resuelve a un array de DesafioMatch.
 */
export const findDesafioMatchesForCapacidad = async (capacidadId: number): Promise<DesafioMatch[]> => {
   if (!capacidadId || typeof capacidadId !== 'number' || !Number.isInteger(capacidadId) || capacidadId <= 0) {
    throw new Error('ID de capacidad inválido.');
  }
   try {
     // Consulta SQL similar, pero buscando desafíos desde una capacidad
     const query = `
       SELECT
           d.desafio_id,
           d.titulo,
           p.nombres_apellidos AS participante_nombre,
           p.organizacion,
           GROUP_CONCAT(DISTINCT pc.palabra ORDER BY pc.palabra SEPARATOR ', ') AS palabras_coincidentes,
           COUNT(DISTINCT pc.palabra_clave_id) AS total_coincidencias
       FROM Capacidades_PalabrasClave cpc
       JOIN Desafios_PalabrasClave dpc ON cpc.palabra_clave_id = dpc.palabra_clave_id
       JOIN PalabrasClave pc ON cpc.palabra_clave_id = pc.palabra_clave_id
       JOIN Desafios d ON dpc.desafio_id = d.desafio_id
       LEFT JOIN Participantes_Externos p ON d.participante_id = p.participante_id
       WHERE cpc.capacidad_id = ?
       GROUP BY d.desafio_id
       ORDER BY total_coincidencias DESC, d.desafio_id ASC;
     `;

     const [rows] = await dbPool.execute<DesafioMatch[]>(query, [capacidadId]);
     console.log(`Encontrados ${rows.length} desafíos coincidentes para capacidad ${capacidadId}`);
     return rows;

   } catch (error: any) {
     console.error(`Error al buscar matches de desafío para capacidad ${capacidadId}:`, error);
     throw new Error('Error al buscar desafíos coincidentes.');
   }
};
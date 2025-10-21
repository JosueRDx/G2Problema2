// /backend/src/api/capacidades/capacidades.service.ts
import dbPool from '../../config/db';
import { PoolConnection, OkPacket, RowDataPacket } from 'mysql2/promise';

interface CapacidadData {
  investigador_id: number; // Vendrá del middleware
  descripcion_capacidad: string;
  problemas_que_resuelven?: string;
  tipos_proyectos?: string;
  equipamiento?: string;
  clave_interna?: string;
  palabrasClave?: string; // String separado por comas desde el frontend
}

// Helper para manejar palabras clave y transacción
// (Exportado para poder ser usado por desafios.service.ts)
export const handleKeywordsAndTransaction = async (
    connection: PoolConnection,
    itemId: number, // capacidad_id o desafio_id
    keywordString: string | undefined,
    linkTable: string, // 'Capacidades_PalabrasClave' o 'Desafios_PalabrasClave'
    idColumnName: string, // 'capacidad_id' o 'desafio_id'
    incrementCounter: boolean = false // Solo true para Desafios
) => {
    if (!keywordString) return;

    // Normaliza, limpia y filtra palabras vacías
    const keywords = keywordString.split(',')
      .map(k => k.trim().toLowerCase())
      .filter(k => k.length > 0 && k.length <= 100); // Añade límite de longitud si es necesario

    if (keywords.length === 0) return;

    // Usar un Set para evitar procesar duplicados en la misma llamada
    const uniqueKeywords = new Set(keywords);

    for (const palabra of uniqueKeywords) {
        // Buscar palabra clave existente
        let [rows] = await connection.execute<RowDataPacket[]>(
            'SELECT palabra_clave_id FROM PalabrasClave WHERE palabra = ?',
            [palabra]
        );

        let palabraClaveId: number;

        if (rows.length > 0) {
            palabraClaveId = rows[0].palabra_clave_id;
            // Incrementar contador SOLO si es un desafío y está especificado
            if (incrementCounter) {
                await connection.execute(
                    'UPDATE PalabrasClave SET conteo_desafios = conteo_desafios + 1 WHERE palabra_clave_id = ?',
                    [palabraClaveId]
                );
            }
        } else {
            // Insertar nueva palabra clave
            const [insertResult] = await connection.execute<OkPacket>(
                'INSERT INTO PalabrasClave (palabra, conteo_desafios) VALUES (?, ?)',
                [palabra, incrementCounter ? 1 : 0] // Inicia contador si es desafío
            );
             if (!insertResult.insertId) {
                console.error(`Error al insertar nueva palabra clave: ${palabra}`);
                // Considera lanzar un error aquí para revertir la transacción si es crítico
                continue; // O saltar esta palabra clave
            }
            palabraClaveId = insertResult.insertId;
        }

        // Vincular con la capacidad/desafío (ignorar si ya existe el par)
        try {
            await connection.execute(
                `INSERT IGNORE INTO ${linkTable} (${idColumnName}, palabra_clave_id) VALUES (?, ?)`,
                [itemId, palabraClaveId]
            );
        } catch (linkError) {
             console.error(`Error al vincular ${idColumnName} ${itemId} con palabra_clave_id ${palabraClaveId}:`, linkError);
             // Considera lanzar un error aquí si el vínculo es crítico
        }
    }
};

export const createCapacidad = async (data: CapacidadData) => {
  const connection = await dbPool.getConnection();
  await connection.beginTransaction();

  try {
    const [result] = await connection.execute<OkPacket>(
      `INSERT INTO Capacidades_UNSA (investigador_id, descripcion_capacidad, problemas_que_resuelven, tipos_proyectos, equipamiento, clave_interna)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.investigador_id,
        data.descripcion_capacidad, // Campo obligatorio
        data.problemas_que_resuelven || null, // Convertir undefined/'' a null
        data.tipos_proyectos || null,
        data.equipamiento || null,
        data.clave_interna || null,
      ]
    );

    const newCapacidadId = result.insertId;
    if (!newCapacidadId) {
        await connection.rollback();
        connection.release();
        throw new Error('Error al insertar la capacidad, no se obtuvo ID.');
    }

    // Manejar palabras clave
    await handleKeywordsAndTransaction(
        connection,
        newCapacidadId,
        data.palabrasClave,
        'Capacidades_PalabrasClave',
        'capacidad_id',
        false // No incrementar contador para capacidades
    );

    await connection.commit();
    connection.release();
    return { insertId: newCapacidadId };

  } catch (error: any) {
    // Asegurarse de hacer rollback y liberar la conexión en caso de error
    if (connection) {
        try {
            await connection.rollback();
            connection.release();
        } catch (rollbackError) {
            console.error("Error durante el rollback:", rollbackError);
        }
    }
    console.error("Error detallado en createCapacidad:", error);
    // Lanzar un error más genérico o específico según prefieras
    throw new Error('Ocurrió un error al registrar la capacidad. Detalles: ' + error.message);
  }
};

export const getCapacidadesByInvestigador = async (investigadorId: number) => {
    if (!investigadorId) {
        throw new Error('ID de investigador no válido.');
    }
    try {
        const [rows] = await dbPool.execute<RowDataPacket[]>(
            `SELECT c.*, GROUP_CONCAT(pc.palabra ORDER BY pc.palabra SEPARATOR ', ') AS palabras_clave
             FROM Capacidades_UNSA c
             LEFT JOIN Capacidades_PalabrasClave cpc ON c.capacidad_id = cpc.capacidad_id
             LEFT JOIN PalabrasClave pc ON cpc.palabra_clave_id = pc.palabra_clave_id
             WHERE c.investigador_id = ?
             GROUP BY c.capacidad_id
             ORDER BY c.capacidad_id DESC`,
            [investigadorId]
        );
        return rows;
    } catch (error: any) {
        console.error(`Error al obtener capacidades para investigador ${investigadorId}:`, error);
        throw new Error('Error al obtener las capacidades del investigador.');
    }
};

// Servicio para admin
export const getAllCapacidades = async () => {
     try {
        const [rows] = await dbPool.execute<RowDataPacket[]>(
             `SELECT c.*, i.nombres_apellidos AS investigador_nombre, GROUP_CONCAT(pc.palabra ORDER BY pc.palabra SEPARATOR ', ') AS palabras_clave
             FROM Capacidades_UNSA c
             JOIN Investigadores_UNSA i ON c.investigador_id = i.investigador_id
             LEFT JOIN Capacidades_PalabrasClave cpc ON c.capacidad_id = cpc.capacidad_id
             LEFT JOIN PalabrasClave pc ON cpc.palabra_clave_id = pc.palabra_clave_id
             GROUP BY c.capacidad_id
             ORDER BY c.capacidad_id DESC`
        );
        return rows;
    } catch (error: any) {
        console.error("Error al obtener todas las capacidades:", error);
        throw new Error('Error al obtener todas las capacidades.');
    }
}
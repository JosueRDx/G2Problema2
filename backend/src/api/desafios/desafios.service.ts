// /backend/src/api/desafios/desafios.service.ts
import dbPool from '../../config/db';
import { PoolConnection, OkPacket, RowDataPacket } from 'mysql2/promise';
// Importa el helper desde el servicio de capacidades (asegúrate que la ruta es correcta)
import { handleKeywordsAndTransaction } from '../capacidades/capacidades.service';

interface DesafioData {
    participante_id: number; // Vendrá del middleware
    titulo: string;
    descripcion?: string;
    impacto?: string;
    intentos_previos?: string;
    solucion_imaginada?: string;
    adjunto_url?: string; // URL o path del archivo guardado
    palabrasClave?: string; // String separado por comas
}

export const createDesafio = async (data: DesafioData) => {
    // Asegúrate de que participante_id exista antes de continuar
    if (typeof data.participante_id !== 'number' || !Number.isInteger(data.participante_id) || data.participante_id <= 0) {
        console.error("ID de participante inválido recibido:", data.participante_id);
        throw new Error('El ID del participante es inválido o no fue proporcionado.');
    }
     // Asegúrate de que el título exista
    if (typeof data.titulo !== 'string' || data.titulo.trim() === '') {
         console.error("Título inválido recibido:", data.titulo);
        throw new Error('El título del desafío es obligatorio.');
    }


    const connection = await dbPool.getConnection();
    console.log("Conexión obtenida para createDesafio.");
    await connection.beginTransaction();
    console.log("Transacción iniciada para createDesafio.");

    try {
        console.log("Intentando insertar desafío con datos:", {
            participante_id: data.participante_id,
            titulo: data.titulo,
            descripcion: data.descripcion || null,
            impacto: data.impacto || null,
            intentos_previos: data.intentos_previos || null,
            solucion_imaginada: data.solucion_imaginada || null,
            adjunto_url: data.adjunto_url || null
        });

        const [result] = await connection.execute<OkPacket>(
            `INSERT INTO Desafios (participante_id, titulo, descripcion, impacto, intentos_previos, solucion_imaginada, adjunto_url, fecha_creacion)
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
                data.participante_id,
                data.titulo,
                data.descripcion || null,    // Convierte undefined/falsy a null
                data.impacto || null,        // Convierte undefined/falsy a null
                data.intentos_previos || null,// Convierte undefined/falsy a null
                data.solucion_imaginada || null, // Convierte undefined/falsy a null
                data.adjunto_url || null,    // Convierte undefined/falsy a null
            ]
        );
        console.log("Resultado de inserción Desafios:", result);

        const newDesafioId = result.insertId;
        if (!newDesafioId) {
             console.error("Error: No se obtuvo insertId después de insertar en Desafios.");
            // No es necesario rollback aquí explícitamente, el bloque catch lo hará.
            throw new Error('Error al insertar el desafío en la base de datos, no se obtuvo ID.');
        }
        console.log(`Desafío base insertado con ID: ${newDesafioId}`);

        // Manejar palabras clave, incrementando el contador
        console.log(`Manejando palabras clave para desafío ${newDesafioId}: "${data.palabrasClave}"`);
        await handleKeywordsAndTransaction(
            connection,
            newDesafioId,
            data.palabrasClave,
            'Desafios_PalabrasClave',
            'desafio_id',
            true // Incrementar contador para desafíos
        );
        console.log(`Palabras clave manejadas para desafío ${newDesafioId}`);

        await connection.commit();
        console.log(`Commit realizado para desafío ${newDesafioId}`);
        connection.release();
        console.log(`Conexión liberada para desafío ${newDesafioId}`);
        return { insertId: newDesafioId };

    } catch (error: any) {
        // Log detallado del error ANTES del rollback
        console.error("Error detallado DENTRO del try/catch en createDesafio:", error);
         // Asegurarse de hacer rollback y liberar la conexión en caso de cualquier error
        if (connection) {
            try {
                console.log("Intentando rollback debido a error...");
                await connection.rollback();
                console.log("Rollback realizado exitosamente.");
            } catch (rollbackError) {
                console.error("Error durante el rollback en createDesafio:", rollbackError);
            } finally {
                 console.log("Liberando conexión desde el bloque catch...");
                 connection.release(); // Libera la conexión SIEMPRE después del intento de rollback
                 console.log("Conexión liberada desde el bloque catch.");
            }
        }
        // Propaga un error claro
        throw new Error('Ocurrió un error al registrar el desafío. Detalles: ' + error.message);
    }
};

export const getDesafiosByParticipante = async (participanteId: number) => {
     if (!participanteId || typeof participanteId !== 'number' || !Number.isInteger(participanteId) || participanteId <= 0) {
        console.error("getDesafiosByParticipante: ID de participante inválido:", participanteId);
        throw new Error('ID de participante no válido.');
    }
    try {
        const [rows] = await dbPool.execute<RowDataPacket[]>(
            `SELECT d.*, GROUP_CONCAT(pc.palabra ORDER BY pc.palabra SEPARATOR ', ') AS palabras_clave
             FROM Desafios d
             LEFT JOIN Desafios_PalabrasClave dpc ON d.desafio_id = dpc.desafio_id
             LEFT JOIN PalabrasClave pc ON dpc.palabra_clave_id = pc.palabra_clave_id
             WHERE d.participante_id = ?
             GROUP BY d.desafio_id
             ORDER BY d.fecha_creacion DESC`,
            [participanteId]
        );
        console.log(`Desafíos encontrados para participante ${participanteId}: ${rows.length}`);
        return rows;
    } catch (error: any) {
        console.error(`Error al obtener desafíos para participante ${participanteId}:`, error);
        throw new Error('Error al obtener los desafíos del participante.');
    }
};

export const getAllDesafios = async () => {
    try {
         const [rows] = await dbPool.execute<RowDataPacket[]>(
            `SELECT
                d.desafio_id,
                d.titulo,
                d.descripcion,
                d.impacto,
                d.intentos_previos,
                d.solucion_imaginada,
                d.adjunto_url,
                d.fecha_creacion,
                p.nombres_apellidos AS participante_nombre,
                p.organizacion,
                h.nombre AS helice_nombre,
                GROUP_CONCAT(DISTINCT pc.palabra ORDER BY pc.palabra SEPARATOR ', ') AS palabras_clave
             FROM Desafios d
             JOIN Participantes_Externos p ON d.participante_id = p.participante_id
             JOIN Helices h ON p.helice_id = h.helice_id
             LEFT JOIN Desafios_PalabrasClave dpc ON d.desafio_id = dpc.desafio_id
             LEFT JOIN PalabrasClave pc ON dpc.palabra_clave_id = pc.palabra_clave_id
             GROUP BY d.desafio_id
             ORDER BY d.fecha_creacion DESC`
        );
        console.log(`Total desafíos encontrados para admin: ${rows.length}`);
        return rows;
    } catch (error: any) {
        console.error("Error al obtener todos los desafíos:", error);
        throw new Error('Error al obtener todos los desafíos.');
    }
};
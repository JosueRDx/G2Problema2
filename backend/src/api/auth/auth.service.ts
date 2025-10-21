// /backend/src/api/auth/auth.service.ts
import dbPool from '../../config/db';
import bcrypt from 'bcrypt';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { env } from '../../config/env';
import { PoolConnection, OkPacket, RowDataPacket } from 'mysql2/promise'; // <-- Importar tipos de MySQL

// --- 1. DEFINICIÓN DE TIPOS PARA EL REGISTRO ---
// (Esto reemplaza el 'any')
interface BaseUserData {
  email: string;
  password: string;
  nombres_apellidos: string;
  cargo: string;
  telefono?: string;
}

interface ExternoUserData extends BaseUserData {
  rol: "externo";
  helice_id: number; // El frontend lo envía como número (después de parseInt)
  organizacion: string;
  dias_interes?: number[];
}

interface UnsaUserData extends BaseUserData {
  rol: "unsa";
  unidad_academica: string;
}

// Tipo de Unión Discriminada
type UserData = ExternoUserData | UnsaUserData;

// --- HELPERS ---
const hashPassword = async (password: string) => {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
};

const rollback = async (connection: PoolConnection, message: string) => {
  await connection.rollback();
  connection.release();
  throw new Error(message);
};

// --- SERVICIO DE REGISTRO (CON TRANSACCIÓN) ---
// --- 2. USAR EL TIPO 'UserData' ESPECÍFICO ---
export const createUser = async (userData: UserData) => {
  
  // (Ya no necesitamos desestructurar 'rol' primero,
  // TypeScript lo manejará en los 'if')

  const connection = await dbPool.getConnection();
  await connection.beginTransaction();

  try {
    // --- 3. ESPECIFICAR EL TIPO DE RETORNO DE LA BD ---
    const [existingUsers] = await connection.execute<RowDataPacket[]>(
      'SELECT * FROM Usuarios WHERE email = ?', [userData.email]
    );
    if (existingUsers.length > 0) {
      await rollback(connection, 'El correo electrónico ya está registrado.');
    }

    const passwordHash = await hashPassword(userData.password);
    
    // --- 4. ESPECIFICAR EL TIPO DE RETORNO DE LA BD ---
    const [userResult] = await connection.execute<OkPacket>(
      'INSERT INTO Usuarios (email, password_hash, rol) VALUES (?, ?, ?)',
      [userData.email, passwordHash, userData.rol]
    );
    const newUserId = userResult.insertId;
    if (!newUserId) {
      await rollback(connection, 'Error al crear el usuario base.');
    }

    // --- 5. TypeScript ahora entiende los 'if' ---
    if (userData.rol === 'externo') {
      // (TypeScript sabe que userData.helice_id y userData.organizacion existen aquí)
      const dias = userData.dias_interes && Array.isArray(userData.dias_interes) ? userData.dias_interes : [];
      
      const [participanteResult] = await connection.execute<OkPacket>(
        `INSERT INTO Participantes_Externos 
         (usuario_id, helice_id, nombres_apellidos, cargo, organizacion, telefono) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [newUserId, userData.helice_id, userData.nombres_apellidos, userData.cargo, userData.organizacion, userData.telefono || null]
      );
      
      const newParticipanteId = participanteResult.insertId;
      if (!newParticipanteId) {
        await rollback(connection, 'Error al crear el perfil de participante.');
      }
      if (dias.length > 0) {
        const diasValues = dias.map((dia_id: number) => [newParticipanteId, dia_id]);
        await connection.query(
          'INSERT INTO Participante_Interes_Dias (participante_id, dia_id) VALUES ?',
          [diasValues]
        );
      }

    } else if (userData.rol === 'unsa') {
      // (TypeScript sabe que userData.unidad_academica existe aquí)
      await connection.execute(
        `INSERT INTO Investigadores_UNSA 
         (usuario_id, nombres_apellidos, cargo, telefono, unidad_academica) 
         VALUES (?, ?, ?, ?, ?)`,
        [newUserId, userData.nombres_apellidos, userData.cargo, userData.telefono || null, userData.unidad_academica]
      );
    } 
    // (El 'else' que tenías para 'Rol no válido' ya no es necesario,
    // porque el tipo 'UserData' solo permite 'externo' o 'unsa')

    await connection.commit();
    connection.release();
    return { insertId: newUserId };

  } catch (error: any) {
    await connection.rollback();
    connection.release();
    throw new Error(error.message || 'Error interno del servidor durante el registro.');
  }
};

// --- SERVICIO DE LOGIN ---
// /backend/src/api/auth/auth.service.ts

// ... (Las interfaces UserData, ExternoUserData, UnsaUserData son las mismas)
// ... (Las funciones hashPassword, rollback, createUser son las mismas)

// --- SERVICIO DE LOGIN (ACTUALIZADO) ---
export const login = async (email: string, password: string) => {
  if (!email || !password) {
    throw new Error('Email y contraseña son requeridos.');
  }

  // 1. Busca al usuario base por email
  const [users] = await dbPool.execute<RowDataPacket[]>(
    'SELECT * FROM Usuarios WHERE email = ?', [email]
  );
  if (users.length === 0) {
    throw new Error('Credenciales inválidas.');
  }
  const user = users[0];

  // 2. Compara la contraseña
  const isPasswordMatch = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordMatch) {
    throw new Error('Credenciales inválidas.');
  }

  // --- 3. Busca el Nombre Completo según el ROL ---
  let userProfile: RowDataPacket | null = null;
  if (user.rol === 'externo') {
    const [profiles] = await dbPool.execute<RowDataPacket[]>(
      'SELECT nombres_apellidos FROM Participantes_Externos WHERE usuario_id = ?',
      [user.usuario_id]
    );
    if (profiles.length > 0) userProfile = profiles[0];
  } else if (user.rol === 'unsa') {
    const [profiles] = await dbPool.execute<RowDataPacket[]>(
      'SELECT nombres_apellidos FROM Investigadores_UNSA WHERE usuario_id = ?',
      [user.usuario_id]
    );
    if (profiles.length > 0) userProfile = profiles[0];
  } else if (user.rol === 'admin') {
     // El admin no tiene perfil separado, podemos usar un nombre genérico o el email
     let userProfile: RowDataPacket | { nombres_apellidos: string } | null = null;
  }


  // 4. Crea el token JWT
  const token = jwt.sign(
    { userId: user.usuario_id, rol: user.rol },
    env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  // 5. Devuelve el token y los datos del usuario (incluyendo el nombre)
  return {
    token,
    user: {
      id: user.usuario_id,
      email: user.email,
      rol: user.rol,
      // Añade el nombre completo (o email si no se encontró el perfil por alguna razón)
      nombres_apellidos: userProfile?.nombres_apellidos || user.email,
    }
  };
};

// ... (La función verify es la misma)

// --- SERVICIO DE VERIFICACIÓN ---
export const verify = async (token: string) => {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    const [users] = await dbPool.execute<RowDataPacket[]>(
      'SELECT usuario_id, email, rol FROM Usuarios WHERE usuario_id = ?',
      [payload.userId]
    );
    if (users.length === 0) {
      throw new Error('El usuario del token ya no existe.');
    }
    return users[0];
  } catch (error) {
    throw new Error('Token inválido o expirado.');
  }
};
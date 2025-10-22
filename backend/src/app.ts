// /backend/src/app.ts
import express from 'express';
import cors from 'cors';
import path from 'path'; // <--- FALTA ESTA LÍNEA (Importa el módulo path)

import authRoutes from './api/auth/auth.routes';
import desafioRoutes from './api/desafios/desafios.routes';
import capacidadRoutes from './api/capacidades/capacidades.routes';
import keywordRoutes from './api/palabras-clave/palabras-clave.routes';
import cronogramaRoutes from './api/cronograma/cronograma.routes'; // <-- NUEVO
import usersRoutes from './api/users/users.routes';
import matchingRoutes from './api/matching/matching.routes';
import matchesRoutes from './api/matches/matches.routes'; 

const app = express();

app.use(cors({
  origin: 'http://localhost:3000' // Asegúrate que sea la URL correcta de tu frontend
}));
app.use(express.json());

// --- SERVIR ARCHIVOS ESTÁTICOS (Adjuntos subidos) --- // <--- AÑADE ESTA SECCIÓN
const uploadsPath = path.join(__dirname, '../../uploads');
console.log(`Sirviendo archivos estáticos desde: ${uploadsPath}`); // Log para depuración
app.use('/uploads', express.static(uploadsPath));
// --- FIN SERVIR ARCHIVOS ESTÁTICOS --- // <--- HASTA AQUÍ

// --- RUTAS DE API ---
// (Tus rutas existentes están bien)
app.use('/api/auth', authRoutes);
app.use('/api/desafios', desafioRoutes);
app.use('/api/capacidades', capacidadRoutes);
app.use('/api/palabras-clave', keywordRoutes);
app.use('/api/cronograma', cronogramaRoutes);
app.use('/api/users', usersRoutes); // <-- NUEVO
app.use('/api/matches', matchesRoutes); // <-- AÑADE ESTA LÍNEA (para las rutas que acabamos de crear)
app.use('/api/matching', matchingRoutes);

export default app;
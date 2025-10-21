// /backend/src/app.ts
import express from 'express';
import cors from 'cors';
import authRoutes from './api/auth/auth.routes';
import desafioRoutes from './api/desafios/desafios.routes';
import capacidadRoutes from './api/capacidades/capacidades.routes';
import keywordRoutes from './api/palabras-clave/palabras-clave.routes';
import cronogramaRoutes from './api/cronograma/cronograma.routes'; // <-- NUEVO

const app = express();

app.use(cors({
  origin: 'http://localhost:3000'
}));
app.use(express.json());

// --- RUTAS DE API ---
app.use('/api/auth', authRoutes);
app.use('/api/desafios', desafioRoutes);
app.use('/api/capacidades', capacidadRoutes);
app.use('/api/palabras-clave', keywordRoutes);
app.use('/api/cronograma', cronogramaRoutes); // <-- NUEVO

export default app;
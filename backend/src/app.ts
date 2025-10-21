import express from 'express';
import cors from 'cors';
import authRoutes from './api/auth/auth.routes';

const app = express();

app.use(cors({
  origin: 'http://localhost:3000'
}));
app.use(express.json());

// --- RUTAS DE API ---
app.use('/api/auth', authRoutes);
// (Aquí añadirás /api/desafios, /api/cronograma, etc.)

export default app;
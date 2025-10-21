import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  DB_HOST: z.string(),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
  DB_NAME: z.string(),
  PORT: z.string().default('3001'),
  JWT_SECRET: z.string(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error(
    '❌ Variables de entorno inválidas:',
    parsedEnv.error.format()
  );
  throw new Error('Variables de entorno inválidas.');
}

export const env = parsedEnv.data;
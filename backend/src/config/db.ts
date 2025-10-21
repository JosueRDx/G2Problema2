import mysql from 'mysql2/promise';
import { env } from './env';

const dbPool = mysql.createPool({
  host: env.DB_HOST,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

dbPool.getConnection()
  .then(connection => {
    console.log('✅ Conexión a la base de datos MySQL exitosa.');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Error al conectar a la base de datos:', err);
  });

export default dbPool;
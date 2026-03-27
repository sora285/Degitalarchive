import mysql from 'mysql2/promise';
import { env } from './env.js';

export const pool = mysql.createPool({
  ...(env.db.socketPath
    ? { socketPath: env.db.socketPath }
    : { host: env.db.host, port: env.db.port }),
  user: env.db.user,
  password: env.db.password,
  database: env.db.name,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: 'Z',
});

export async function checkDbConnection() {
  const connection = await pool.getConnection();
  try {
    await connection.ping();
  } finally {
    connection.release();
  }
}

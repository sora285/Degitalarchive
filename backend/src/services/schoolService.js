import { pool } from '../config/db.js';

export async function listSchools() {
  const [rows] = await pool.execute(
    `SELECT id, slug, name
     FROM schools
     ORDER BY id ASC`
  );

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
  }));
}

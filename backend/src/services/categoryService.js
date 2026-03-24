import { pool } from '../config/db.js';

export async function listCategoriesBySchoolId(schoolId) {
  const [rows] = await pool.execute(
    `SELECT c.id, c.name
     FROM categories c
     INNER JOIN schools s ON s.id = c.school_id
     WHERE s.slug = ?
     ORDER BY c.id ASC`,
    [schoolId]
  );

  return rows
    .filter((row) => row.name)
    .map((row) => ({
      id: String(row.id),
      label: String(row.name),
    }));
}

export async function createCategoryBySchoolId({ schoolId, label }) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [schoolRows] = await connection.execute(
      `SELECT id
       FROM schools
       WHERE slug = ?
       LIMIT 1`,
      [schoolId]
    );

    if (!schoolRows.length) {
      await connection.rollback();
      return null;
    }

    const schoolDbId = schoolRows[0].id;

    const [existingRows] = await connection.execute(
      `SELECT id, name
       FROM categories
       WHERE school_id = ? AND name = ?
       LIMIT 1`,
      [schoolDbId, label]
    );

    if (existingRows.length) {
      await connection.commit();
      return {
        id: String(existingRows[0].id),
        label: String(existingRows[0].name),
      };
    }

    const [result] = await connection.execute(
      `INSERT INTO categories (name, school_id, created_at)
       VALUES (?, ?, NOW())`,
      [label, schoolDbId]
    );

    await connection.commit();
    return {
      id: String(result.insertId),
      label,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

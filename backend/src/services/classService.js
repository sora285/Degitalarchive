import { pool } from '../config/db.js';

export async function listClassesBySchoolId(schoolId) {
  const [rows] = await pool.execute(
    /* language=MySQL */
    `SELECT c.classNo, c.className
     FROM t_digitalArchive_classes c
     INNER JOIN schools s ON s.id = c.school_id
     WHERE s.slug = ?
     ORDER BY c.sortNo ASC, c.classNo ASC`,
    [schoolId]
  );

  return rows
    .map((row) => ({
      id: String(row.classNo),
      label: String(row.className || '').trim(),
    }))
    .filter((row) => row.label);
}

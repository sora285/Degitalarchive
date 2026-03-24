import { pool } from '../config/db.js';

export async function listCompaniesBySchoolId(schoolId) {
  const [rows] = await pool.execute(
    `SELECT c.id, c.contents
     FROM companies c
     INNER JOIN schools s ON s.id = c.school_id
     WHERE s.slug = ?
     ORDER BY c.id ASC`,
    [schoolId]
  );

  return rows
    .filter((row) => row.contents)
    .map((row) => ({
      id: String(row.id),
      label: String(row.contents),
    }));
}

export async function deleteCompanyByIdAndSchoolId({ schoolId, companyId }) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [companyRows] = await connection.execute(
      `SELECT c.id
       FROM companies c
       INNER JOIN schools s ON s.id = c.school_id
       WHERE s.slug = ? AND c.id = ?
       LIMIT 1`,
      [schoolId, companyId]
    );

    if (!companyRows.length) {
      await connection.rollback();
      return false;
    }

    try {
      await connection.execute(
        `DELETE FROM activity_companies
         WHERE company_id = ? OR companies_id = ?`,
        [companyId, companyId]
      );
    } catch (error) {
      if (error?.code !== 'ER_BAD_FIELD_ERROR' && error?.code !== 'ER_NO_SUCH_TABLE') {
        throw error;
      }
    }

    const [result] = await connection.execute(
      `DELETE FROM companies
       WHERE id = ?`,
      [companyId]
    );

    await connection.commit();
    return result.affectedRows > 0;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function createCompanyBySchoolId({ schoolId, label }) {
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
      `SELECT id, contents
       FROM companies
       WHERE school_id = ? AND contents = ?
       LIMIT 1`,
      [schoolDbId, label]
    );

    if (existingRows.length) {
      await connection.commit();
      return {
        id: String(existingRows[0].id),
        label: String(existingRows[0].contents),
      };
    }

    const [result] = await connection.execute(
      `INSERT INTO companies (contents, school_id, created_at, updated_at)
       VALUES (?, ?, NOW(), NOW())`,
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

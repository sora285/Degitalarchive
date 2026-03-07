import { pool } from '../config/db.js';

function parseJsonArray(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function rowToArticle(row) {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    sdgs: parseJsonArray(row.sdgs),
    category: row.category,
    grade: row.grade,
    tags: parseJsonArray(row.tags),
    company: row.company || '',
    date: row.date,
    location: {
      lat: Number(row.latitude ?? 0),
      lng: Number(row.longitude ?? 0),
      name: row.location_name || '',
    },
  };
}

export async function listArticlesBySchoolId(schoolId) {
  const [rows] = await pool.execute(
    `SELECT
      a.id,
      a.title,
      a.content,
      a.sdgs,
      a.category,
      a.grade,
      a.tags,
      a.company,
      DATE_FORMAT(a.article_date, '%Y/%m/%d') AS date,
      a.location_name,
      a.latitude,
      a.longitude
    FROM articles a
    INNER JOIN schools s ON s.id = a.school_id
    WHERE s.slug = ?
    ORDER BY a.article_date DESC, a.id DESC`,
    [schoolId]
  );

  return rows.map(rowToArticle);
}

export async function getArticleById({ schoolId, articleId }) {
  const [rows] = await pool.execute(
    `SELECT
      a.id,
      a.title,
      a.content,
      a.sdgs,
      a.category,
      a.grade,
      a.tags,
      a.company,
      DATE_FORMAT(a.article_date, '%Y/%m/%d') AS date,
      a.location_name,
      a.latitude,
      a.longitude
    FROM articles a
    INNER JOIN schools s ON s.id = a.school_id
    WHERE s.slug = ? AND a.id = ?
    LIMIT 1`,
    [schoolId, articleId]
  );

  if (!rows.length) {
    return null;
  }

  return rowToArticle(rows[0]);
}

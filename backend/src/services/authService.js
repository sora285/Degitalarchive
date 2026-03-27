import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
import { env } from '../config/env.js';

function buildUserResponse(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    schoolId: row.school_slug,
    role: row.role || 'user',
  };
}

async function createAuthResultByUserId(userId) {
  const [rows] = await pool.execute(
    `SELECT
      u.id,
      u.name,
      u.email,
      u.role,
      s.slug AS school_slug
    FROM users u
    INNER JOIN schools s ON s.id = u.school_id
    WHERE u.id = ?
    LIMIT 1`,
    [userId]
  );

  const user = rows[0];
  const token = jwt.sign(
    {
      sub: user.id,
      schoolId: user.school_slug,
      role: user.role || 'user',
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );

  return {
    token,
    user: buildUserResponse(user),
  };
}

export async function login({ username, password, schoolId }) {
  const [rows] = await pool.execute(
    `SELECT
      u.id,
      u.name,
      u.email,
      u.password,
      u.role,
      s.slug AS school_slug
    FROM users u
    INNER JOIN schools s ON s.id = u.school_id
    WHERE s.slug = ?
      AND (u.email = ? OR u.name = ?)
    LIMIT 1`,
    [schoolId, username, username]
  );

  if (!rows.length) {
    return { ok: false, status: 401, message: '学校IDまたは認証情報が正しくありません。' };
  }

  const user = rows[0];
  const matched = await bcrypt.compare(password, user.password);

  if (!matched) {
    return { ok: false, status: 401, message: '学校IDまたは認証情報が正しくありません。' };
  }

  const token = jwt.sign(
    {
      sub: user.id,
      schoolId: user.school_slug,
      role: user.role || 'user',
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );

  return {
    ok: true,
    status: 200,
    token,
    user: buildUserResponse(user),
  };
}

export async function register({ name, email, password, schoolId }) {
  const [schoolRows] = await pool.execute(
    'SELECT id, slug FROM schools WHERE slug = ? LIMIT 1',
    [schoolId]
  );

  if (!schoolRows.length) {
    return { ok: false, status: 400, message: '指定された学校が見つかりません。' };
  }

  const school = schoolRows[0];

  const [existingRows] = await pool.execute(
    'SELECT id FROM users WHERE school_id = ? AND email = ? LIMIT 1',
    [school.id, email]
  );

  if (existingRows.length) {
    return { ok: false, status: 409, message: 'このメールアドレスは既に登録されています。' };
  }

  const hash = await bcrypt.hash(password, 12);
  const [insertResult] = await pool.execute(
    `INSERT INTO users (name, email, password, school_id, role, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'user', NOW(), NOW())`,
    [name, email, hash, school.id]
  );

  const created = await createAuthResultByUserId(insertResult.insertId);
  return {
    ok: true,
    status: 201,
    token: created.token,
    user: created.user,
  };
}

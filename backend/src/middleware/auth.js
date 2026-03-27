import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

function readToken(req) {
  return req.cookies?.auth_token || '';
}

export function authenticateRequest(req, _res, next) {
  const token = readToken(req);
  if (!token) {
    req.auth = null;
    return next();
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    req.auth = {
      userId: Number(payload.sub),
      schoolId: String(payload.schoolId || ''),
      role: String(payload.role || 'user'),
    };
  } catch {
    req.auth = null;
  }

  return next();
}

export function requireAdmin(req, res, next) {
  if (!req.auth) {
    return res.status(401).json({ message: 'ログインが必要です。' });
  }

  if (req.auth.role !== 'admin') {
    return res.status(403).json({ message: '管理者のみ実行できます。' });
  }

  const requestedSchoolId = String(req.body?.schoolId || req.query?.schoolId || '');
  if (requestedSchoolId && req.auth.schoolId !== requestedSchoolId) {
    return res.status(403).json({ message: '他校の操作はできません。' });
  }

  return next();
}

export function requireAuthenticated(req, res, next) {
  if (!req.auth) {
    return res.status(401).json({ message: 'ログインが必要です。' });
  }

  const requestedSchoolId = String(req.body?.schoolId || req.query?.schoolId || '');
  if (requestedSchoolId && req.auth.schoolId !== requestedSchoolId) {
    return res.status(403).json({ message: '他校の操作はできません。' });
  }

  return next();
}

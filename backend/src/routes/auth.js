import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { getCurrentAuthenticatedUser, login, register } from '../services/authService.js';
import { requireAuthenticated } from '../middleware/auth.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'ログイン試行回数が多すぎます。しばらく待ってから再試行してください。' },
});

router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const { username, password, schoolId } = req.body ?? {};

    if (!username || !password || !schoolId) {
      return res.status(400).json({
        message: 'username, password, schoolId は必須です。',
      });
    }

    const result = await login({ username, password, schoolId });

    if (!result.ok) {
      return res.status(result.status).json({ message: result.message });
    }

    res.cookie('auth_token', result.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.COOKIE_SECURE === 'true',
      maxAge: 2 * 60 * 60 * 1000,
      path: '/',
    });

    return res.status(200).json({
      user: result.user,
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, schoolId } = req.body ?? {};

    if (!name || !email || !password || !schoolId) {
      return res.status(400).json({
        message: 'name, email, password, schoolId は必須です。',
      });
    }

    if (String(password).length < 8) {
      return res.status(400).json({
        message: 'パスワードは8文字以上で入力してください。',
      });
    }

    const result = await register({ name, email, password, schoolId });

    if (!result.ok) {
      return res.status(result.status).json({ message: result.message });
    }

    res.cookie('auth_token', result.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.COOKIE_SECURE === 'true',
      maxAge: 2 * 60 * 60 * 1000,
      path: '/',
    });

    return res.status(201).json({
      user: result.user,
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/logout', (_req, res) => {
  res.clearCookie('auth_token', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.COOKIE_SECURE === 'true',
    path: '/',
  });
  res.status(204).send();
});

router.get('/me', requireAuthenticated, async (req, res, next) => {
  try {
    const userId = Number(req.auth?.userId || 0);
    const user = await getCurrentAuthenticatedUser({ userId });

    if (!user) {
      return res.status(404).json({ message: 'ユーザーが見つかりません。' });
    }

    return res.status(200).json({ user });
  } catch (error) {
    return next(error);
  }
});

export default router;

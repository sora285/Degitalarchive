import { Router } from 'express';
import { getArticleById, listArticlesBySchoolId } from '../services/articleService.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const schoolId = String(req.query.schoolId || '');
    if (!schoolId) {
      return res.status(400).json({ message: 'schoolId は必須です。' });
    }

    const articles = await listArticlesBySchoolId(schoolId);
    return res.status(200).json({ articles });
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const schoolId = String(req.query.schoolId || '');
    const articleId = Number(req.params.id);

    if (!schoolId) {
      return res.status(400).json({ message: 'schoolId は必須です。' });
    }

    if (!Number.isFinite(articleId) || articleId <= 0) {
      return res.status(400).json({ message: '記事IDが不正です。' });
    }

    const article = await getArticleById({ schoolId, articleId });
    if (!article) {
      return res.status(404).json({ message: '記事が見つかりません。' });
    }

    return res.status(200).json({ article });
  } catch (error) {
    return next(error);
  }
});

export default router;

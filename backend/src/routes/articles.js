import { Router } from 'express';
import {
  createArticle,
  getArticleById,
  getArticleImageById,
  listArticlesBySchoolId,
  removeArticle,
  updateArticle,
} from '../services/articleService.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const schoolId = String(req.query.schoolId || '');
    if (!schoolId) {
      return res.status(400).json({ message: 'schoolId は必須です。' });
    }

    const includeDrafts = req.auth?.role === 'admin' && req.auth?.schoolId === schoolId;
    const articles = await listArticlesBySchoolId(schoolId, { includeDrafts });
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

    const includeDraftRelations =
      req.auth?.role === 'admin' && req.auth?.schoolId === schoolId;
    const article = await getArticleById({ schoolId, articleId, includeDraftRelations });
    if (!article) {
      return res.status(404).json({ message: '記事が見つかりません。' });
    }

    const canReadDraft =
      article.status !== 'draft' ||
      (req.auth?.role === 'admin' && req.auth?.schoolId === schoolId);

    if (!canReadDraft) {
      return res.status(404).json({ message: '記事が見つかりません。' });
    }

    return res.status(200).json({ article });
  } catch (error) {
    return next(error);
  }
});

router.get('/:id/image', async (req, res, next) => {
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

    const canReadDraft =
      article.status !== 'draft' ||
      (req.auth?.role === 'admin' && req.auth?.schoolId === schoolId);

    if (!canReadDraft) {
      return res.status(404).json({ message: '記事画像が見つかりません。' });
    }

    const imageUrl = await getArticleImageById({ schoolId, articleId });
    if (!imageUrl) {
      return res.status(404).json({ message: '記事画像が見つかりません。' });
    }

    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    return res.redirect(302, imageUrl);
  } catch (error) {
    return next(error);
  }
});

router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const schoolId = String(req.body?.schoolId || '');

    if (!schoolId) {
      return res.status(400).json({ message: 'schoolId は必須です。' });
    }

    const article = await createArticle({
      schoolId,
      userId: Number(req.body?.userId || 0),
      status: String(req.body?.status || 'published'),
      title: String(req.body?.title || ''),
      content: String(req.body?.content || ''),
      grade: String(req.body?.grade || ''),
      locationName: String(req.body?.locationName || ''),
      latitude: req.body?.latitude,
      longitude: req.body?.longitude,
      sdgIds: Array.isArray(req.body?.sdgIds) ? req.body.sdgIds : [],
      categoryIds: Array.isArray(req.body?.categoryIds) ? req.body.categoryIds : [],
      companyIds: Array.isArray(req.body?.companyIds) ? req.body.companyIds : [],
      libraryImageUrls: Array.isArray(req.body?.libraryImageUrls) ? req.body.libraryImageUrls : [],
      uploadedImages: Array.isArray(req.body?.uploadedImages) ? req.body.uploadedImages : [],
      parentActivityId: req.body?.parentActivityId,
      childActivityIds: Array.isArray(req.body?.childActivityIds) ? req.body.childActivityIds : [],
    });

    return res.status(201).json({ article });
  } catch (error) {
    return next(error);
  }
});

router.put('/:id', requireAdmin, async (req, res, next) => {
  try {
    const schoolId = String(req.body?.schoolId || '');
    const articleId = Number(req.params.id);

    if (!schoolId) {
      return res.status(400).json({ message: 'schoolId は必須です。' });
    }

    if (!Number.isFinite(articleId) || articleId <= 0) {
      return res.status(400).json({ message: '記事IDが不正です。' });
    }

    const article = await updateArticle({
      articleId,
      schoolId,
      userId: Number(req.body?.userId || 0),
      status: String(req.body?.status || 'published'),
      title: String(req.body?.title || ''),
      content: String(req.body?.content || ''),
      grade: String(req.body?.grade || ''),
      locationName: String(req.body?.locationName || ''),
      latitude: req.body?.latitude,
      longitude: req.body?.longitude,
      sdgIds: Array.isArray(req.body?.sdgIds) ? req.body.sdgIds : [],
      categoryIds: Array.isArray(req.body?.categoryIds) ? req.body.categoryIds : [],
      companyIds: Array.isArray(req.body?.companyIds) ? req.body.companyIds : [],
      libraryImageUrls: Array.isArray(req.body?.libraryImageUrls) ? req.body.libraryImageUrls : [],
      uploadedImages: Array.isArray(req.body?.uploadedImages) ? req.body.uploadedImages : [],
      parentActivityId: req.body?.parentActivityId,
      childActivityIds: Array.isArray(req.body?.childActivityIds) ? req.body.childActivityIds : [],
    });

    return res.status(200).json({ article });
  } catch (error) {
    return next(error);
  }
});

router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const schoolId = String(req.query.schoolId || '');
    const articleId = Number(req.params.id);

    if (!schoolId) {
      return res.status(400).json({ message: 'schoolId は必須です。' });
    }

    if (!Number.isFinite(articleId) || articleId <= 0) {
      return res.status(400).json({ message: '記事IDが不正です。' });
    }

    await removeArticle({ schoolId, articleId });
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

export default router;

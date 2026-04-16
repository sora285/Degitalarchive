import { Router } from 'express';
import {
  createArticle,
  getArticleById,
  getArticleImageById,
  listArticlesBySchoolId,
  removeArticle,
  updateArticle,
} from '../services/articleService.js';
import { requireAuthenticated } from '../middleware/auth.js';

const router = Router();

function isStaffOfSchool(req, schoolId) {
  return Boolean(
    req.auth &&
      req.auth.schoolId === schoolId &&
      (req.auth.role === 'admin' || req.auth.role === 'user')
  );
}

function canReadArticle(req, schoolId, article) {
  if (article.status === 'private_draft') {
    return Boolean(
      req.auth &&
      req.auth.schoolId === schoolId &&
      req.auth.userId === article.authorUserId
    );
  }

  if (article.status === 'pending') {
    return isStaffOfSchool(req, schoolId);
  }

  return article.status === 'published';
}

router.get('/', async (req, res, next) => {
  try {
    const schoolId = String(req.query.schoolId || '');
    if (!schoolId) {
      return res.status(400).json({ message: 'schoolId は必須です。' });
    }

    const articles = await listArticlesBySchoolId(schoolId, {
      viewerUserId: isStaffOfSchool(req, schoolId) ? req.auth?.userId : 0,
      canViewPending: isStaffOfSchool(req, schoolId),
    });
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

    const includeDraftRelations = isStaffOfSchool(req, schoolId);
    const article = await getArticleById({
      schoolId,
      articleId,
      includeDraftRelations,
      viewerUserId: includeDraftRelations ? req.auth?.userId : 0,
      canViewPending: includeDraftRelations,
    });
    if (!article) {
      return res.status(404).json({ message: '記事が見つかりません。' });
    }

    if (!canReadArticle(req, schoolId, article)) {
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

    const article = await getArticleById({
      schoolId,
      articleId,
      includeDraftRelations: isStaffOfSchool(req, schoolId),
      viewerUserId: isStaffOfSchool(req, schoolId) ? req.auth?.userId : 0,
      canViewPending: isStaffOfSchool(req, schoolId),
    });
    if (!article) {
      return res.status(404).json({ message: '記事が見つかりません。' });
    }

    if (!canReadArticle(req, schoolId, article)) {
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

router.post('/', requireAuthenticated, async (req, res, next) => {
  try {
    const schoolId = String(req.body?.schoolId || '');

    if (!schoolId) {
      return res.status(400).json({ message: 'schoolId は必須です。' });
    }

    const requestedUserId = Number(req.body?.userId || 0);
    const actingUserId = req.auth?.userId || requestedUserId;
    const isAdmin = req.auth?.role === 'admin';

    const article = await createArticle({
      schoolId,
      userId: actingUserId,
      status: isAdmin
        ? String(req.body?.status || 'published')
        : (String(req.body?.status || '') === 'private_draft' ? 'private_draft' : 'pending'),
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

router.put('/:id', requireAuthenticated, async (req, res, next) => {
  try {
    const schoolId = String(req.body?.schoolId || '');
    const articleId = Number(req.params.id);

    if (!schoolId) {
      return res.status(400).json({ message: 'schoolId は必須です。' });
    }

    if (!Number.isFinite(articleId) || articleId <= 0) {
      return res.status(400).json({ message: '記事IDが不正です。' });
    }

    const existingArticle = await getArticleById({
      schoolId,
      articleId,
      includeDraftRelations: true,
      canViewPending: true,
    });
    if (!existingArticle) {
      return res.status(404).json({ message: '記事が見つかりません。' });
    }

    const isAdmin = req.auth?.role === 'admin';
    const isOwner = existingArticle.authorUserId === req.auth?.userId;

    if (!isAdmin) {
      if (!isOwner) {
        return res.status(403).json({ message: '自分が作成した記事のみ編集できます。' });
      }

      if (existingArticle.status === 'published') {
        return res.status(403).json({ message: '一般教員は公開済みの記事を編集できません。' });
      }
    }

    const article = await updateArticle({
      articleId,
      schoolId,
      userId: Number(req.auth?.userId || req.body?.userId || 0),
      status: isAdmin
        ? String(req.body?.status || existingArticle.status || 'published')
        : (String(req.body?.status || '') === 'private_draft' ? 'private_draft' : 'pending'),
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

router.delete('/:id', requireAuthenticated, async (req, res, next) => {
  try {
    const schoolId = String(req.query.schoolId || '');
    const articleId = Number(req.params.id);

    if (!schoolId) {
      return res.status(400).json({ message: 'schoolId は必須です。' });
    }

    if (!Number.isFinite(articleId) || articleId <= 0) {
      return res.status(400).json({ message: '記事IDが不正です。' });
    }

    const existingArticle = await getArticleById({
      schoolId,
      articleId,
      includeDraftRelations: true,
      viewerUserId: req.auth?.userId || 0,
      canViewPending: true,
    });
    if (!existingArticle) {
      return res.status(404).json({ message: '記事が見つかりません。' });
    }

    const isAdmin = req.auth?.role === 'admin';
    const isOwner = existingArticle.authorUserId === req.auth?.userId;
    const canDeletePrivateDraft = existingArticle.status === 'private_draft' && isOwner;

    if (!isAdmin && !canDeletePrivateDraft) {
      return res.status(403).json({ message: '下書き記事の削除は本人のみ実行できます。' });
    }

    await removeArticle({ schoolId, articleId });
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

export default router;

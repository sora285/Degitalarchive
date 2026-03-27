import { Router } from 'express';
import { createCategoryBySchoolId, listCategoriesBySchoolId } from '../services/categoryService.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const schoolId = String(req.query.schoolId || '');
    if (!schoolId) {
      return res.status(400).json({ message: 'schoolId は必須です。' });
    }

    const categories = await listCategoriesBySchoolId(schoolId);
    return res.status(200).json({ categories });
  } catch (error) {
    return next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const schoolId = String(req.query.schoolId || '');
    const label = String(req.body?.label || '').trim();

    if (!schoolId) {
      return res.status(400).json({ message: 'schoolId は必須です。' });
    }

    if (!label) {
      return res.status(400).json({ message: 'カテゴリ名は必須です。' });
    }

    const category = await createCategoryBySchoolId({ schoolId, label });
    if (!category) {
      return res.status(404).json({ message: '学校が見つかりません。' });
    }

    return res.status(201).json({ category });
  } catch (error) {
    return next(error);
  }
});

export default router;

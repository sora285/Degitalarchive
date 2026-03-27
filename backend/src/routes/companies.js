import { Router } from 'express';
import { createCompanyBySchoolId, deleteCompanyByIdAndSchoolId, listCompaniesBySchoolId } from '../services/companyService.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const schoolId = String(req.query.schoolId || '');
    if (!schoolId) {
      return res.status(400).json({ message: 'schoolId は必須です。' });
    }

    const companies = await listCompaniesBySchoolId(schoolId);
    return res.status(200).json({ companies });
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
      return res.status(400).json({ message: '企業名は必須です。' });
    }

    const company = await createCompanyBySchoolId({ schoolId, label });
    if (!company) {
      return res.status(404).json({ message: '学校が見つかりません。' });
    }

    return res.status(201).json({ company });
  } catch (error) {
    return next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const schoolId = String(req.query.schoolId || '');
    const companyId = Number(req.params.id);

    if (!schoolId) {
      return res.status(400).json({ message: 'schoolId は必須です。' });
    }

    if (!Number.isFinite(companyId) || companyId <= 0) {
      return res.status(400).json({ message: '企業IDが不正です。' });
    }

    const deleted = await deleteCompanyByIdAndSchoolId({ schoolId, companyId });
    if (!deleted) {
      return res.status(404).json({ message: '企業が見つかりません。' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    return next(error);
  }
});

export default router;

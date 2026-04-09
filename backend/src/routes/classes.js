import { Router } from 'express';
import { listClassesBySchoolId } from '../services/classService.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const schoolId = String(req.query.schoolId || '');
    if (!schoolId) {
      return res.status(400).json({ message: 'schoolId は必須です。' });
    }

    const classes = await listClassesBySchoolId(schoolId);
    return res.status(200).json({ classes });
  } catch (error) {
    return next(error);
  }
});

export default router;

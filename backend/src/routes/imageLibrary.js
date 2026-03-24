import { Router } from 'express';
import { listImageLibraryBySchoolId } from '../services/imageLibraryService.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const schoolId = String(req.query.schoolId || '');
    if (!schoolId) {
      return res.status(400).json({ message: 'schoolId は必須です。' });
    }

    const images = await listImageLibraryBySchoolId(schoolId);
    return res.status(200).json({ images });
  } catch (error) {
    return next(error);
  }
});

export default router;

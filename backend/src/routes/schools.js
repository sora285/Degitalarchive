import { Router } from 'express';
import { listSchools } from '../services/schoolService.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const schools = await listSchools();
    return res.status(200).json({ schools });
  } catch (error) {
    return next(error);
  }
});

export default router;

import { Router } from 'express';
import { search, subjects, getBook } from '../controllers/booksController.js';
import { requireAuth } from '../middleware/auth.js';
import { searchRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.use(requireAuth(), searchRateLimiter);
router.get('/', search);
router.get('/subjects', subjects);
router.get('/:id', getBook);

export default router;

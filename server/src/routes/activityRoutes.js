import { Router } from 'express';
import { feed } from '../controllers/activityController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/feed', requireAuth(), feed);

export default router;

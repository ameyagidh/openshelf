import { Router } from 'express';
import { myShelves, upsertShelfEntry, removeShelfEntry } from '../controllers/shelfController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth());
router.get('/', myShelves);
router.post('/', upsertShelfEntry);
router.delete('/:bookId', removeShelfEntry);

export default router;

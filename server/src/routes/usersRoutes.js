import { Router } from 'express';
import { getProfile, uploadAvatar, listUsers } from '../controllers/usersController.js';
import { followUser, unfollowUser, followers, following } from '../controllers/followController.js';
import { requireAuth } from '../middleware/auth.js';
import { uploadAvatar as uploadAvatarMiddleware } from '../middleware/upload.js';

const router = Router();

router.get('/', requireAuth(), listUsers);
router.get('/:id', requireAuth(), getProfile);
router.post('/me/avatar', requireAuth(), uploadAvatarMiddleware, uploadAvatar);
router.post('/:userId/follow', requireAuth(), followUser);
router.delete('/:userId/follow', requireAuth(), unfollowUser);
router.get('/:userId/followers', requireAuth(), followers);
router.get('/:userId/following', requireAuth(), following);

export default router;

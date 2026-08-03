import { asyncHandler } from '../utils/asyncHandler.js';
import { getFeed } from '../services/activityService.js';

export const feed = asyncHandler(async (req, res) => {
  const { scope, cursor, limit } = req.query;
  const result = await getFeed({
    forUser: req.user._id,
    scope: scope === 'following' ? 'following' : 'global',
    cursor,
    limit: limit ? Number(limit) : undefined,
  });
  res.json(result);
});

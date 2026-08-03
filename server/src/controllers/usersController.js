import { User } from '../models/User.js';
import { Follow } from '../models/Follow.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');

  const [followerCount, followingCount, isFollowing] = await Promise.all([
    Follow.countDocuments({ followee: user._id }),
    Follow.countDocuments({ follower: user._id }),
    req.user ? Follow.exists({ follower: req.user._id, followee: user._id }) : null,
  ]);

  res.json({
    user: user.toSafeJSON(),
    followerCount,
    followingCount,
    isFollowing: Boolean(isFollowing),
  });
});

export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No file uploaded');
  const avatarUrl = `/uploads/${req.file.filename}`;
  const user = await User.findByIdAndUpdate(req.user._id, { avatarUrl }, { new: true });
  res.json({ user: user.toSafeJSON() });
});

export const listUsers = asyncHandler(async (req, res) => {
  const q = req.query.q;
  const filter = q ? { name: { $regex: q, $options: 'i' } } : {};
  const users = await User.find(filter).limit(20).select('name avatarUrl bio');
  res.json({ users });
});

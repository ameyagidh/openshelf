import { Follow } from '../models/Follow.js';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { recordActivity } from '../services/activityService.js';

export const followUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (userId === req.user._id.toString()) throw ApiError.badRequest('Cannot follow yourself');

  const target = await User.findById(userId);
  if (!target) throw ApiError.notFound('User not found');

  const existing = await Follow.findOne({ follower: req.user._id, followee: userId });
  if (existing) throw ApiError.conflict('Already following');

  await Follow.create({ follower: req.user._id, followee: userId });
  await recordActivity({ actor: req.user._id, type: 'followed', targetUser: userId });

  res.status(201).json({ following: true });
});

export const unfollowUser = asyncHandler(async (req, res) => {
  await Follow.findOneAndDelete({ follower: req.user._id, followee: req.params.userId });
  res.status(204).send();
});

export const followers = asyncHandler(async (req, res) => {
  const rows = await Follow.find({ followee: req.params.userId }).populate('follower', 'name avatarUrl bio');
  res.json({ followers: rows.map((r) => r.follower) });
});

export const following = asyncHandler(async (req, res) => {
  const rows = await Follow.find({ follower: req.params.userId }).populate('followee', 'name avatarUrl bio');
  res.json({ following: rows.map((r) => r.followee) });
});

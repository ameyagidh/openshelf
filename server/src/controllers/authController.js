import { z } from 'zod';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  REFRESH_COOKIE_NAME,
  refreshCookieOptions,
} from '../utils/tokens.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(80),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function issueTokens(res, user) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());
  return accessToken;
}

export const register = asyncHandler(async (req, res) => {
  const { email, password, name } = registerSchema.parse(req.body);

  const existing = await User.findOne({ email });
  if (existing) throw ApiError.conflict('An account with this email already exists');

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({ email, passwordHash, name });

  const accessToken = issueTokens(res, user);
  res.status(201).json({ user: user.toSafeJSON(), accessToken });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);

  const user = await User.findOne({ email });
  if (!user) throw ApiError.unauthorized('Invalid email or password');

  const valid = await user.comparePassword(password);
  if (!valid) throw ApiError.unauthorized('Invalid email or password');

  const accessToken = issueTokens(res, user);
  res.json({ user: user.toSafeJSON(), accessToken });
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!token) throw ApiError.unauthorized('Missing refresh token');

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const user = await User.findById(payload.sub);
  if (!user || user.refreshTokenVersion !== payload.v) {
    throw ApiError.unauthorized('Refresh token has been revoked');
  }

  const accessToken = issueTokens(res, user);
  res.json({ user: user.toSafeJSON(), accessToken });
});

export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  if (token) {
    try {
      const payload = verifyRefreshToken(token);
      await User.findByIdAndUpdate(payload.sub, { $inc: { refreshTokenVersion: 1 } });
    } catch {
      // token already invalid — nothing to revoke
    }
  }
  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
  res.status(204).send();
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user.toSafeJSON() });
});

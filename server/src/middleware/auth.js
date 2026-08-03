import { verifyAccessToken } from '../utils/tokens.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/User.js';

export function requireAuth() {
  return async (req, res, next) => {
    try {
      const header = req.headers.authorization || '';
      const token = header.startsWith('Bearer ') ? header.slice(7) : null;
      if (!token) throw ApiError.unauthorized('Missing bearer token');

      const payload = verifyAccessToken(token);
      const user = await User.findById(payload.sub);
      if (!user) throw ApiError.unauthorized('User no longer exists');

      req.user = user;
      next();
    } catch {
      next(ApiError.unauthorized('Invalid or expired access token'));
    }
  };
}

/** Optional auth: attaches req.user if a valid token is present, but never rejects. */
export function attachUserIfPresent() {
  return async (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return next();
    try {
      const payload = verifyAccessToken(token);
      req.user = await User.findById(payload.sub);
    } catch {
      // ignore invalid token in optional-auth contexts
    }
    next();
  };
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(ApiError.forbidden('Insufficient role'));
    }
    next();
  };
}

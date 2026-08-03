import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

export function notFoundHandler(req, res) {
  res.status(404).json({ error: { message: `No route for ${req.method} ${req.originalUrl}` } });
}

export function errorHandler(err, req, res, _next) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ error: { message: err.message, details: err.details } });
  }

  if (err?.name === 'ValidationError') {
    return res.status(400).json({ error: { message: err.message } });
  }

  if (err?.name === 'ZodError') {
    return res.status(400).json({ error: { message: 'Validation failed', details: err.issues } });
  }

  if (err?.code === 11000) {
    return res.status(409).json({ error: { message: 'Duplicate resource' } });
  }

  if (err?.name === 'MulterError') {
    return res.status(400).json({ error: { message: err.message } });
  }

  logger.error('Unhandled error', { message: err?.message, stack: err?.stack });
  const status = err?.statusCode || 500;
  res.status(status).json({ error: { message: err?.message || 'Internal server error' } });
}

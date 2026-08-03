import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { UPLOADS_DIR } from './middleware/upload.js';
import { openapiSpec } from './docs/openapi.js';
import authRoutes from './routes/authRoutes.js';
import booksRoutes from './routes/booksRoutes.js';
import shelfRoutes from './routes/shelfRoutes.js';
import reviewsRoutes from './routes/reviewsRoutes.js';
import usersRoutes from './routes/usersRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  app.use(
    helmet({
      // Swagger UI's inline script tag needs this relaxed; fine for a portfolio API docs page.
      contentSecurityPolicy: false,
    })
  );
  app.use(cors({ origin: env.clientOrigin, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());
  if (env.nodeEnv !== 'test') app.use(morgan('dev'));

  app.use('/uploads', express.static(UPLOADS_DIR));

  app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));
  app.get('/api/openapi.json', (req, res) => res.json(openapiSpec));

  app.use('/api/auth', authRoutes);
  app.use('/api/books', booksRoutes);
  app.use('/api/shelf', shelfRoutes);
  app.use('/api/reviews', reviewsRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/activity', activityRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

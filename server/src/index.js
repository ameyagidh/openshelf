import http from 'node:http';
import { createApp } from './app.js';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

async function main() {
  await connectDb();
  const app = createApp();
  http.createServer(app).listen(env.port, () => {
    logger.info(`openshelf API listening on :${env.port}`);
  });
}

main().catch((err) => {
  logger.error('Fatal startup error', { message: err.message, stack: err.stack });
  process.exit(1);
});

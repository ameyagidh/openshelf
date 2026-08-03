import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

export async function connectDb(uri = env.mongoUri) {
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  logger.info(`Mongo connected: ${mongoose.connection.name}`);
  return mongoose.connection;
}

export async function disconnectDb() {
  await mongoose.disconnect();
}

import mongoose from 'mongoose';

// Docker Mongo (port 27018), throwaway per-suite database — see pulseboard's
// docs/DECISIONS.md for why this beats mongodb-memory-server here.
export async function connectTestDb(suiteName) {
  const dbName = `openshelf_test_${suiteName}_${Date.now()}`;
  await mongoose.connect(`mongodb://localhost:27018/${dbName}`);
  return dbName;
}

export async function dropAndDisconnectTestDb() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
}

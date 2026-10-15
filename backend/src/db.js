const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const config = require('./config');

let memoryServer = null;
let activeMode = null;

function connectWithTimeout(uri, timeoutMs) {
  return mongoose.connect(uri, {
    serverSelectionTimeoutMS: timeoutMs,
    maxPoolSize: 10,
  });
}

/**
 * Connect to MongoDB.
 *
 * Strategy:
 *  1. Try the configured MONGO_URI (real local MongoDB, Atlas, Docker, etc.).
 *  2. If it is unreachable (e.g. MongoDB is not installed), automatically
 *     start an ephemeral in-memory MongoDB so the app still runs locally
 *     with zero extra setup. Data is reset whenever the backend restarts.
 */
async function connectToDatabase() {
  const uri = config.mongoURI;

  // 1) Prefer a real MongoDB when it is reachable
  try {
    await connectWithTimeout(uri, 8000);
    activeMode = 'external';
    console.log(`[DB] Connected to MongoDB at ${uri}`);
    return { mode: 'external', uri };
  } catch (err) {
    console.warn(`[DB] Could not connect to MongoDB at ${uri}: ${err.message}`);
    console.warn('[DB] Falling back to an in-memory MongoDB (no local install needed).');
    try {
      await mongoose.disconnect();
    } catch {
      /* ignore */
    }
  }

  // 2) Fallback: ephemeral in-memory MongoDB
  try {
    console.log('[DB] Starting in-memory MongoDB (first run downloads the mongod binary)...');
    memoryServer = await MongoMemoryServer.create();
    const memoryUri = memoryServer.getUri('quizcraft');
    await connectWithTimeout(memoryUri, 20000);
    activeMode = 'memory';
    console.log(`[DB] Connected to in-memory MongoDB at ${memoryUri}`);
    console.log('[DB] NOTE: Data is ephemeral and resets whenever the backend restarts.');
    return { mode: 'memory', uri: memoryUri };
  } catch (err) {
    console.error('[DB] Failed to start in-memory MongoDB:', err.message);
    throw err;
  }
}

async function stopDatabase() {
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
  activeMode = null;
}

module.exports = { connectToDatabase, stopDatabase };
const mongoose = require('mongoose');
const config = require('./config');

let memoryServer = null;
let activeMode = null;

/**
 * Indicates whether we are running in a serverless environment (e.g. Vercel).
 * In serverless we must NOT attempt to start an in-memory MongoDB, because the
 * mongodb-memory-server package downloads and spawns a mongod binary at
 * runtime, which is not supported on the Vercel platform.
 */
function isServerless() {
  return (
    process.env.VERCEL === '1' ||
    process.env.NODE_ENV === 'production'
  );
}

function connectWithTimeout(uri, timeoutMs) {
  return mongoose.connect(uri, {
    serverSelectionTimeoutMS: timeoutMs,
    maxPoolSize: 10,
  });
}

/**
 * Lazy-load the in-memory MongoDB. It is required only when the fallback is
 * actually used, so importing this module in a serverless bundle will never
 * pull in (or attempt to download) the mongod binary.
 */
async function startMemoryServer() {
  // Only available outside of serverless environments.
  if (isServerless()) {
    const err = new Error(
      'No MONGO_URI configured and in-memory MongoDB is unavailable in ' +
        'this environment. Set the MONGO_URI environment variable to a ' +
        'reachable MongoDB (e.g. MongoDB Atlas) and redeploy.'
    );
    err.code = 'DB_CONFIG';
    throw err;
  }
  // eslint-disable-next-line global-require
  const { MongoMemoryServer } = require('mongodb-memory-server');
  memoryServer = await MongoMemoryServer.create();
  const memoryUri = memoryServer.getUri('quizcraft');
  await connectWithTimeout(memoryUri, 20000);
  activeMode = 'memory';
  return { mode: 'memory', uri: memoryUri };
}

/**
 * Connect to MongoDB.
 *
 * Strategy:
 *  1. Try the configured MONGO_URI (real local MongoDB, Atlas, Docker, etc.).
 *  2. If it is unreachable (e.g. MongoDB is not installed) and we are NOT in a
 *     serverless environment, automatically start an ephemeral in-memory
 *     MongoDB so the app still runs locally with zero extra setup. Data is
 *     reset whenever the backend restarts.
 *  3. In serverless environments (Vercel) the in-memory fallback is disabled,
 *     so a misconfigured or missing MONGO_URI surfaces a clear error instead
 *     of a misleading connection failure.
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
    if (isServerless()) {
      throw err;
    }
    console.warn('[DB] Falling back to an in-memory MongoDB (no local install needed).');
    try {
      await mongoose.disconnect();
    } catch {
      /* ignore */
    }
  }

  // 2) Fallback: ephemeral in-memory MongoDB (local/dev only)
  return startMemoryServer();
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
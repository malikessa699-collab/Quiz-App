/**
 * Vercel Serverless entry point for the QuizCraft backend.
 *
 * Vercel rewrites `/api/*` requests to this function but preserves the
 * original request path (e.g. `/api/auth/login`). The Express app in
 * backend/src/server.js already defines its routes with the `/api` prefix,
 * so we forward the request as-is.
 *
 * MongoDB connection: serverless functions can be cold-started and run in
 * many instances, so we lazily connect on first request and reuse the
 * cached connection promise for subsequent invocations on the same instance.
 */
const express = require('express');
const mongoose = require('mongoose');
const config = require('../backend/src/config');
const app = require('../backend/src/server');

// Cache the connection promise across warm invocations.
let connectionPromise = null;

function getDbConnection() {
  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(config.mongoURI, {
        serverSelectionTimeoutMS: 8000,
        maxPoolSize: 1,
      })
      .then(() => {
        console.log(`[Vercel] Connected to MongoDB at ${config.mongoURI.split('@').pop()}`);
        return mongoose.connection;
      })
      .catch((err) => {
        console.error('[Vercel] MongoDB connection failed:', err.message);
        // Reset so the next invocation can retry.
        connectionPromise = null;
        throw err;
      });
  }
  return connectionPromise;
}

const handler = express();

// 1) Ensure the DB is connected before the app processes any /api request.
//    Vercel preserves the original path, so requests arrive as /api/...
handler.use('/api', async (req, res, next) => {
  try {
    await getDbConnection();
    next();
  } catch (err) {
    res.status(500).json({
      success: false,
      status: 'error',
      message: 'Database connection failed. Please try again later.',
    });
  }
});

// 2) Forward to the existing Express app. Its routes are already defined
//    under /api (e.g. /api/auth, /api/quizzes), matching the incoming path.
handler.use(app);

module.exports = handler;

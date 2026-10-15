const express = require('express');
const cors = require('cors');
const config = require('./config');
const User = require('./models/User');
const { connectToDatabase, stopDatabase } = require('./db');
const { generalLimiter } = require('./middleware/rateLimiter');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const quizRoutes = require('./routes/quizRoutes');
const attemptRoutes = require('./routes/attemptRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// ------------------------------------------------------------------
// Global middleware
// ------------------------------------------------------------------
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(generalLimiter);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ------------------------------------------------------------------
// Routes
// ------------------------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/attempts', attemptRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);

// ------------------------------------------------------------------
// 404 + error handling (must be last)
// ------------------------------------------------------------------
app.use(notFound);
app.use(errorHandler);

// ------------------------------------------------------------------
// Bootstrap admin account (only on startup, only if missing)
// ------------------------------------------------------------------
async function bootstrapAdmin() {
  try {
    const existing = await User.findOne({ email: config.admin.email.toLowerCase() });
    if (!existing) {
      await User.create({
        name: config.admin.name,
        email: config.admin.email,
        password: config.admin.password,
        role: 'admin',
      });
      console.log(`[Bootstrap] Admin account created: ${config.admin.email}`);
    } else {
      console.log('[Bootstrap] Admin account already exists.');
    }
  } catch (err) {
    console.error('[Bootstrap] Failed to create admin:', err.message);
  }
}

// ------------------------------------------------------------------
// Startup
// ------------------------------------------------------------------
async function startServer() {
  try {
    const db = await connectToDatabase();

    await bootstrapAdmin();

    app.listen(config.port, () => {
      console.log(`[Server] QuizCraft backend running on http://localhost:${config.port}`);
      console.log(`[Server] Environment: ${config.env}`);
      console.log(`[Server] Database mode: ${db.mode === 'memory' ? 'IN-MEMORY (automatic fallback)' : 'external MongoDB'}`);
      console.log(`[Server] AI provider: ${config.ai.provider || 'builtin-fallback'}`);
    });
  } catch (err) {
    console.error('[Startup] Failed to start server:', err.message);
    process.exit(1);
  }
}

// Only auto-start when run directly (not when imported for tests)
if (require.main === module) {
  startServer();
}

// Graceful shutdown (important for stopping the ephemeral in-memory MongoDB)
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, async () => {
    console.log(`[Server] Received ${signal}, shutting down...`);
    await stopDatabase().catch(() => {});
    process.exit(0);
  });
}

module.exports = app;
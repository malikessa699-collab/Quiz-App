const express = require('express');
const { generateQuiz, getQuiz, submitAttempt } = require('../controllers/quizController');
const { protect } = require('../middleware/auth');
const { requireJsonBody, requireFields } = require('../middleware/validation');
const { createGenerationLimiter } = require('../middleware/rateLimiter');
const ApplicationSettings = require('../models/ApplicationSettings');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router();

router.use(protect);

// Dynamic rate limit for generation based on admin settings
router.post(
  '/generate',
  requireJsonBody,
  requireFields(['topic']),
  async (req, res, next) => {
    try {
      const settings = await ApplicationSettings.getSettings();
      createGenerationLimiter(settings.quizGenerationRateLimit)(req, res, next);
    } catch (err) {
      next(err);
    }
  },
  generateQuiz
);

router.get('/:id', getQuiz);
router.post('/:id/attempts', requireJsonBody, submitAttempt);

module.exports = router;
const QuizAttempt = require('../models/QuizAttempt');
const { buildAnalytics } = require('../services/analyticsService');
const { asyncHandler } = require('../middleware/asyncHandler');

/**
 * GET /api/analytics/summary
 * Returns the overall preparation summary for the authenticated user.
 */
exports.getSummary = asyncHandler(async (req, res, next) => {
  const attempts = await QuizAttempt.find({ user: req.user._id }).sort({ completionDate: -1 }).lean();

  const analytics = buildAnalytics(attempts);

  res.status(200).json({
    success: true,
    analytics,
  });
});

/**
 * GET /api/analytics/topics
 * Returns subject-wise performance for the authenticated user.
 */
exports.getTopics = asyncHandler(async (req, res, next) => {
  const attempts = await QuizAttempt.find({ user: req.user._id }).sort({ completionDate: 1 }).lean();
  const analytics = buildAnalytics(attempts);

  res.status(200).json({
    success: true,
    topics: analytics.topics,
    weakTopics: analytics.weakTopics,
    strongTopics: analytics.strongTopics,
  });
});

/**
 * GET /api/analytics/timeline
 * Returns chronological performance data for charts.
 */
exports.getTimeline = asyncHandler(async (req, res, next) => {
  const attempts = await QuizAttempt.find({ user: req.user._id })
    .sort({ completionDate: 1 })
    .select('topic title percentage passed completionDate')
    .lean();

  res.status(200).json({
    success: true,
    timeline: attempts.map((a) => ({
      id: a._id,
      topic: a.topic,
      title: a.title,
      percentage: a.percentage,
      passed: a.passed,
      completionDate: a.completionDate,
    })),
  });
});
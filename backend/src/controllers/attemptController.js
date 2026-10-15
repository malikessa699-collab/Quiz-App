const QuizAttempt = require('../models/QuizAttempt');
const { AppError } = require('../middleware/errorHandler');
const { asyncHandler } = require('../middleware/asyncHandler');

/**
 * GET /api/attempts/history?page=1&limit=10&topic=
 * Returns the authenticated user's attempt history (paginated).
 */
exports.getHistory = asyncHandler(async (req, res, next) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
  const skip = (page - 1) * limit;

  const filter = { user: req.user._id };
  if (req.query.topic) {
    filter.topic = { $regex: String(req.query.topic), $options: 'i' };
  }

  const [total, attempts] = await Promise.all([
    QuizAttempt.countDocuments(filter),
    QuizAttempt.find(filter)
      .sort({ completionDate: -1 })
      .skip(skip)
      .limit(limit)
      .select('topic title difficulty mode score totalMarks percentage passed passingPercentage timeTakenSeconds completionDate createdAt'),
  ]);

  res.status(200).json({
    success: true,
    attempts: attempts.map((a) => ({
      id: a._id,
      topic: a.topic,
      title: a.title,
      difficulty: a.difficulty,
      mode: a.mode,
      score: a.score,
      totalMarks: a.totalMarks,
      percentage: a.percentage,
      passed: a.passed,
      passingPercentage: a.passingPercentage,
      timeTakenSeconds: a.timeTakenSeconds,
      completionDate: a.completionDate,
    })),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    },
  });
});

/**
 * GET /api/attempts/:id
 * Returns a full attempt result with answer review.
 * Users can only access their own attempts (admins may view all).
 */
exports.getAttempt = asyncHandler(async (req, res, next) => {
  const attempt = await QuizAttempt.findById(req.params.id);
  if (!attempt) {
    return next(new AppError('Attempt not found.', 404));
  }

  const isOwner = String(attempt.user) === String(req.user._id);
  const isAdmin = req.user.role === 'admin';
  if (!isOwner && !isAdmin) {
    return next(new AppError('You do not have permission to view this attempt.', 403));
  }

  res.status(200).json({
    success: true,
    attempt: {
      id: attempt._id,
      topic: attempt.topic,
      title: attempt.title,
      difficulty: attempt.difficulty,
      mode: attempt.mode,
      questions: attempt.questions,
      selectedAnswers: Object.fromEntries(attempt.selectedAnswers || new Map()),
      score: attempt.score,
      totalMarks: attempt.totalMarks,
      percentage: attempt.percentage,
      passed: attempt.passed,
      passingPercentage: attempt.passingPercentage,
      timeTakenSeconds: attempt.timeTakenSeconds,
      completionDate: attempt.completionDate,
    },
  });
});

/**
 * DELETE /api/attempts/:id
 * Students may delete their own attempts.
 */
exports.deleteAttempt = asyncHandler(async (req, res, next) => {
  const attempt = await QuizAttempt.findById(req.params.id);
  if (!attempt) {
    return next(new AppError('Attempt not found.', 404));
  }
  if (String(attempt.user) !== String(req.user._id)) {
    return next(new AppError('You can only delete your own attempts.', 403));
  }

  await attempt.deleteOne();
  res.status(200).json({ success: true, message: 'Attempt deleted.' });
});
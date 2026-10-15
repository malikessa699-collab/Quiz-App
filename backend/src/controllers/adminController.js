const User = require('../models/User');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const ApplicationSettings = require('../models/ApplicationSettings');
const { AppError } = require('../middleware/errorHandler');
const { asyncHandler } = require('../middleware/asyncHandler');

/**
 * GET /api/admin/stats
 * Platform-wide statistics for the admin dashboard.
 */
exports.getStats = asyncHandler(async (req, res, next) => {
  const [totalUsers, totalStudents, totalAdmins, totalQuizzes, totalAttempts] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'admin' }),
    Quiz.countDocuments(),
    QuizAttempt.countDocuments(),
  ]);

  const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5).select('name email role isActive createdAt');
  const recentAttempts = await QuizAttempt.find()
    .sort({ completionDate: -1 })
    .limit(5)
    .populate('user', 'name email')
    .select('topic title percentage passed user completionDate');

  const avgPercentageAgg = await QuizAttempt.aggregate([
    { $group: { _id: null, avg: { $avg: '$percentage' }, passCount: { $sum: { $cond: ['$passed', 1, 0] } } } },
  ]);
  const averagePercentage = avgPercentageAgg.length ? Math.round(avgPercentageAgg[0].avg * 100) / 100 : 0;
  const passCount = avgPercentageAgg.length ? avgPercentageAgg[0].passCount : 0;

  res.status(200).json({
    success: true,
    stats: {
      totalUsers,
      totalStudents,
      totalAdmins,
      totalQuizzes,
      totalAttempts,
      averagePercentage,
      passCount,
      recentUsers: recentUsers.map((u) => ({ id: u._id, name: u.name, email: u.email, role: u.role, isActive: u.isActive, createdAt: u.createdAt })),
      recentAttempts: recentAttempts.map((a) => ({
        id: a._id,
        topic: a.topic,
        title: a.title,
        percentage: a.percentage,
        passed: a.passed,
        userName: a.user ? a.user.name : 'Unknown',
        userEmail: a.user ? a.user.email : '',
        completionDate: a.completionDate,
      })),
    },
  });
});

/**
 * GET /api/admin/users?page=1&limit=20
 * Lists all registered users.
 */
exports.getUsers = asyncHandler(async (req, res, next) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const skip = (page - 1) * limit;

  const [total, users] = await Promise.all([
    User.countDocuments(),
    User.find().sort({ createdAt: -1 }).skip(skip).limit(limit).select('name email role isActive createdAt'),
  ]);

  res.status(200).json({
    success: true,
    users: users.map((u) => ({ id: u._id, name: u.name, email: u.email, role: u.role, isActive: u.isActive, createdAt: u.createdAt })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

/**
 * PATCH /api/admin/users/:id
 * Body: { role?, isActive? }
 * Admin can change a user's role or deactivate/activate an account.
 */
exports.updateUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new AppError('User not found.', 404));
  }

  if (req.body.role !== undefined) {
    if (!['student', 'admin'].includes(req.body.role)) {
      return next(new AppError('Role must be student or admin.', 400));
    }
    if (String(user._id) === String(req.user._id) && req.body.role !== 'admin') {
      return next(new AppError('You cannot remove your own admin role.', 400));
    }
    user.role = req.body.role;
  }

  if (req.body.isActive !== undefined) {
    if (String(user._id) === String(req.user._id) && req.body.isActive === false) {
      return next(new AppError('You cannot deactivate your own account.', 400));
    }
    user.isActive = Boolean(req.body.isActive);
  }

  await user.save();
  res.status(200).json({ success: true, user: user.toSafeJSON() });
});

/**
 * GET /api/admin/settings
 * Returns application settings (passing percentage, timer, etc.).
 */
exports.getSettings = asyncHandler(async (req, res, next) => {
  const settings = await ApplicationSettings.getSettings();
  res.status(200).json({ success: true, settings });
});

/**
 * PATCH /api/admin/settings
 * Body: { passingPercentage?, defaultTimerMinutes?, allowPracticeMode?, quizGenerationRateLimit? }
 */
exports.updateSettings = asyncHandler(async (req, res, next) => {
  const settings = await ApplicationSettings.getSettings();

  if (req.body.passingPercentage !== undefined) {
    const value = Number(req.body.passingPercentage);
    if (Number.isNaN(value) || value < 0 || value > 100) {
      return next(new AppError('Passing percentage must be between 0 and 100.', 400));
    }
    settings.passingPercentage = value;
  }
  if (req.body.defaultTimerMinutes !== undefined) {
    const value = Number(req.body.defaultTimerMinutes);
    if (Number.isNaN(value) || value < 1 || value > 180) {
      return next(new AppError('Default timer must be between 1 and 180 minutes.', 400));
    }
    settings.defaultTimerMinutes = value;
  }
  if (req.body.allowPracticeMode !== undefined) {
    settings.allowPracticeMode = Boolean(req.body.allowPracticeMode);
  }
  if (req.body.quizGenerationRateLimit !== undefined) {
    const value = Number(req.body.quizGenerationRateLimit);
    if (Number.isNaN(value) || value < 1) {
      return next(new AppError('Rate limit must be at least 1.', 400));
    }
    settings.quizGenerationRateLimit = value;
  }

  await settings.save();
  res.status(200).json({ success: true, settings });
});
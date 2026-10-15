const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const { asyncHandler } = require('../middleware/asyncHandler');

const signToken = (id) => jwt.sign({ id }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

const sendAuthResponse = (user, statusCode, res) => {
  const token = signToken(user._id);
  res.status(statusCode).json({
    success: true,
    token,
    user: user.toSafeJSON(),
  });
};

/**
 * POST /api/auth/register
 * Body: { name, email, password, grade?, institution? }
 */
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, grade = '', institution = '' } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return next(new AppError('An account with this email already exists. Please log in.', 409));
  }

  const user = await User.create({
    name,
    email,
    password,
    role: 'student',
    profile: { grade, institution },
  });

  sendAuthResponse(user, 201, res);
});

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Invalid email or password.', 401));
  }
  if (!user.isActive) {
    return next(new AppError('This account has been deactivated. Contact an administrator.', 403));
  }

  sendAuthResponse(user, 200, res);
});

/**
 * GET /api/auth/me
 * Returns the currently authenticated user.
 */
exports.getMe = asyncHandler(async (req, res, next) => {
  res.status(200).json({ success: true, user: req.user.toSafeJSON() });
});

/**
 * PATCH /api/auth/profile
 * Body: { name?, grade?, institution?, bio? }
 */
exports.updateProfile = asyncHandler(async (req, res, next) => {
  const { name, grade, institution, bio } = req.body;

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length < 2) {
      return next(new AppError('Name must be at least 2 characters.', 400));
    }
    req.user.name = name.trim();
  }
  if (grade !== undefined) req.user.profile.grade = String(grade).trim();
  if (institution !== undefined) req.user.profile.institution = String(institution).trim();
  if (bio !== undefined) req.user.profile.bio = String(bio).slice(0, 300);

  await req.user.save();
  res.status(200).json({ success: true, user: req.user.toSafeJSON() });
});

/**
 * PATCH /api/auth/password
 * Body: { currentPassword, newPassword }
 */
exports.changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword))) {
    return next(new AppError('Current password is incorrect.', 401));
  }
  if (!newPassword || newPassword.length < 6) {
    return next(new AppError('New password must be at least 6 characters.', 400));
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({ success: true, message: 'Password updated successfully.' });
});
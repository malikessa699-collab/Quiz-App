const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');
const { AppError } = require('./errorHandler');
const { asyncHandler } = require('./asyncHandler');

/**
 * Protect routes: requires a valid Bearer token.
 * Attaches req.user with the safe user object.
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) {
    token = header.slice(7);
  }

  if (!token) {
    return next(new AppError('You are not logged in. Please log in to continue.', 401));
  }

  const decoded = jwt.verify(token, config.jwtSecret);

  const user = await User.findById(decoded.id);
  if (!user) {
    return next(new AppError('The user belonging to this token no longer exists.', 401));
  }
  if (!user.isActive) {
    return next(new AppError('This account has been deactivated. Contact an administrator.', 403));
  }

  req.user = user;
  next();
});

/**
 * Restrict routes to one or more roles.
 * Usage: restrictTo('admin') or restrictTo('admin', 'student')
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }
    next();
  };
};

module.exports = { protect, restrictTo };
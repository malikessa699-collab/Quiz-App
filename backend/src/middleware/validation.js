const { AppError } = require('./errorHandler');

/**
 * Validates required fields on req.body.
 * @param {string[]} fields - list of required field names
 */
const requireFields = (fields) => (req, res, next) => {
  const missing = fields.filter((f) => req.body[f] === undefined || req.body[f] === null || req.body[f] === '');
  if (missing.length > 0) {
    return next(new AppError(`Missing required field(s): ${missing.join(', ')}`, 400));
  }
  next();
};

/**
 * Validates that a request body is an object (JSON).
 */
const requireJsonBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) {
    return next();
  }
  next(new AppError('Request body must be a JSON object.', 400));
};

module.exports = { requireFields, requireJsonBody };
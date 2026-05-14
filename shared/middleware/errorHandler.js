const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      details: err.details,
    });
  }
  logger.error({ err, path: req.path }, 'unhandled error');
  res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
}

module.exports = errorHandler;

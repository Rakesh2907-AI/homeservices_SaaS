const jwtUtil = require('../utils/jwt');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Missing bearer token'));
  }
  try {
    const payload = jwtUtil.verify(header.slice(7));
    req.user = payload;
    // Cross-check: token's tenant must match the resolved tenant.
    if (req.tenantId && payload.tenantId && payload.tenantId !== req.tenantId) {
      return next(new ForbiddenError('Token tenant mismatch'));
    }
    next();
  } catch (err) {
    next(new UnauthorizedError('Invalid or expired token'));
  }
}

function requireRole(...allowed) {
  return (req, res, next) => {
    if (!req.user) return next(new UnauthorizedError());
    if (!allowed.includes(req.user.role)) {
      return next(new ForbiddenError(`Requires one of: ${allowed.join(', ')}`));
    }
    next();
  };
}

module.exports = { authenticate, requireRole };

const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';
const REFRESH_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '30d';

function signAccess(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
}

function signRefresh(payload) {
  return jwt.sign({ ...payload, type: 'refresh' }, SECRET, { expiresIn: REFRESH_EXPIRES_IN });
}

function verify(token) {
  return jwt.verify(token, SECRET);
}

module.exports = { signAccess, signRefresh, verify };

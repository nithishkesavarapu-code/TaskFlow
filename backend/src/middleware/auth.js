const { verifyAccessToken } = require('../utils/jwt');
const { sendError } = require('../utils/response');
const { query } = require('../config/db');
const logger = require('../utils/logger');

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Access token is required', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    const { rows } = await query(
      'SELECT id, name, email, role, is_active FROM users WHERE id = $1',
      [decoded.userId],
    );

    if (!rows.length || !rows[0].is_active) {
      return sendError(res, 'User not found or account deactivated', 401);
    }

    req.user = rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 'Access token has expired. Please refresh your token.', 401);
    }
    if (err.name === 'JsonWebTokenError') {
      return sendError(res, 'Invalid access token', 401);
    }
    logger.error('Auth middleware error', { error: err.message });
    return sendError(res, 'Authentication failed', 500);
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return sendError(
      res,
      `Access denied. Required role(s): ${roles.join(', ')}`,
      403,
    );
  }
  next();
};

module.exports = { verifyToken, requireRole };

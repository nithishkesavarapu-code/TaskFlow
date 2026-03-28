const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { sendSuccess, sendError, asyncHandler } = require('../utils/response');
const logger = require('../utils/logger');

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const { rows: existing } = await query(
    'SELECT id FROM users WHERE email = $1',
    [email.toLowerCase()],
  );
  if (existing.length) {
    return sendError(res, 'Email is already registered', 409);
  }

  const password_hash = await bcrypt.hash(password, 12);

  const { rows } = await query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, 'user')
     RETURNING id, name, email, role, created_at`,
    [name.trim(), email.toLowerCase(), password_hash],
  );

  const user = rows[0];
  const accessToken  = signAccessToken({ userId: user.id, role: user.role });
  const refreshToken = signRefreshToken({ userId: user.id });

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await query(
    'INSERT INTO refresh_tokens (token, user_id, expires_at) VALUES ($1, $2, $3)',
    [refreshToken, user.id, expiresAt],
  );

  logger.info(`New user registered: ${user.email}`);
  return sendSuccess(
    res,
    { accessToken, refreshToken, user },
    'Registration successful',
    201,
  );
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const { rows } = await query(
    'SELECT id, name, email, role, password_hash, is_active FROM users WHERE email = $1',
    [email.toLowerCase()],
  );

  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return sendError(res, 'Invalid email or password', 401);
  }

  if (!user.is_active) {
    return sendError(res, 'Your account has been deactivated. Contact support.', 403);
  }

  const accessToken  = signAccessToken({ userId: user.id, role: user.role });
  const refreshToken = signRefreshToken({ userId: user.id });

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await query(
    'INSERT INTO refresh_tokens (token, user_id, expires_at) VALUES ($1, $2, $3)',
    [refreshToken, user.id, expiresAt],
  );

  const { password_hash, ...safeUser } = user;

  logger.info(`User logged in: ${user.email}`);
  return sendSuccess(res, { accessToken, refreshToken, user: safeUser }, 'Login successful');
});

const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;
  if (!token) return sendError(res, 'Refresh token is required', 400);

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    return sendError(res, 'Invalid or expired refresh token', 401);
  }

  const { rows } = await query(
    'SELECT id, user_id, expires_at FROM refresh_tokens WHERE token = $1',
    [token],
  );
  if (!rows.length || new Date(rows[0].expires_at) < new Date()) {
    return sendError(res, 'Refresh token is invalid or has expired', 401);
  }

  await query('DELETE FROM refresh_tokens WHERE id = $1', [rows[0].id]);

  const { rows: userRows } = await query(
    'SELECT id, role FROM users WHERE id = $1 AND is_active = true',
    [decoded.userId],
  );
  if (!userRows.length) return sendError(res, 'User not found', 401);

  const newAccessToken  = signAccessToken({ userId: userRows[0].id, role: userRows[0].role });
  const newRefreshToken = signRefreshToken({ userId: userRows[0].id });
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await query(
    'INSERT INTO refresh_tokens (token, user_id, expires_at) VALUES ($1, $2, $3)',
    [newRefreshToken, userRows[0].id, expiresAt],
  );

  return sendSuccess(
    res,
    { accessToken: newAccessToken, refreshToken: newRefreshToken },
    'Token refreshed',
  );
});

const logout = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;
  if (token) {
    await query('DELETE FROM refresh_tokens WHERE token = $1', [token]);
  }
  return sendSuccess(res, {}, 'Logged out successfully');
});

const getMe = asyncHandler(async (req, res) => {
  const { rows } = await query(
    'SELECT id, name, email, role, is_active, created_at, updated_at FROM users WHERE id = $1',
    [req.user.id],
  );
  return sendSuccess(res, { user: rows[0] }, 'Profile fetched');
});

const updateProfile = asyncHandler(async (req, res) => {
  const { name } = req.body;
  const { rows } = await query(
    'UPDATE users SET name = $1 WHERE id = $2 RETURNING id, name, email, role, updated_at',
    [name.trim(), req.user.id],
  );
  return sendSuccess(res, { user: rows[0] }, 'Profile updated');
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const { rows } = await query(
    'SELECT password_hash FROM users WHERE id = $1',
    [req.user.id],
  );
  if (!(await bcrypt.compare(currentPassword, rows[0].password_hash))) {
    return sendError(res, 'Current password is incorrect', 400);
  }

  const newHash = await bcrypt.hash(newPassword, 12);
  await query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, req.user.id]);

  await query('DELETE FROM refresh_tokens WHERE user_id = $1', [req.user.id]);

  return sendSuccess(res, {}, 'Password changed. Please log in again.');
});

module.exports = { register, login, refreshToken, logout, getMe, updateProfile, changePassword };

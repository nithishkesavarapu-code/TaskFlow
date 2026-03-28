const { query } = require('../config/db');
const { sendSuccess, sendError, asyncHandler } = require('../utils/response');

const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, role } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const conditions = [];
  const params = [];
  let idx = 1;

  if (search) {
    conditions.push(`(name ILIKE $${idx} OR email ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }
  if (role) {
    conditions.push(`role = $${idx++}`);
    params.push(role);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const { rows: countRows } = await query(`SELECT COUNT(*) FROM users ${where}`, params);
  const { rows } = await query(
    `SELECT id, name, email, role, is_active, created_at
     FROM users ${where}
     ORDER BY created_at DESC
     LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, parseInt(limit), offset],
  );

  return sendSuccess(res, {
    users: rows,
    pagination: {
      total: parseInt(countRows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(countRows[0].count / parseInt(limit)),
    },
  }, 'Users fetched');
});

const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role, is_active } = req.body;

  if (id === req.user.id) {
    return sendError(res, 'Admins cannot modify their own role/status', 400);
  }

  const { rows } = await query(
    `UPDATE users SET
       role      = COALESCE($1, role),
       is_active = COALESCE($2, is_active)
     WHERE id = $3
     RETURNING id, name, email, role, is_active, updated_at`,
    [role || null, is_active !== undefined ? is_active : null, id],
  );

  if (!rows.length) return sendError(res, 'User not found', 404);
  return sendSuccess(res, { user: rows[0] }, 'User updated');
});

const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (id === req.user.id) return sendError(res, 'Cannot delete your own account', 400);

  const { rows } = await query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
  if (!rows.length) return sendError(res, 'User not found', 404);
  return sendSuccess(res, {}, 'User deleted');
});

const getStats = asyncHandler(async (req, res) => {
  const [userStats, taskStats] = await Promise.all([
    query(`SELECT
             COUNT(*)                                    AS total_users,
             COUNT(*) FILTER (WHERE role = 'admin')      AS admins,
             COUNT(*) FILTER (WHERE is_active = false)   AS inactive_users
           FROM users`),
    query(`SELECT
             COUNT(*)                                        AS total_tasks,
             COUNT(*) FILTER (WHERE status = 'pending')      AS pending,
             COUNT(*) FILTER (WHERE status = 'in_progress')  AS in_progress,
             COUNT(*) FILTER (WHERE status = 'completed')    AS completed,
             COUNT(*) FILTER (WHERE priority = 'high')       AS high_priority
           FROM tasks`),
  ]);

  return sendSuccess(res, {
    stats: {
      users: userStats.rows[0],
      tasks: taskStats.rows[0],
    },
  }, 'Platform stats fetched');
});

module.exports = { getAllUsers, updateUser, deleteUser, getStats };

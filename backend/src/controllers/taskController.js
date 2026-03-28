const { query } = require('../config/db');
const { sendSuccess, sendError, asyncHandler } = require('../utils/response');

const createTask = asyncHandler(async (req, res) => {
  const { title, description, status = 'pending', priority = 'medium', due_date } = req.body;

  const { rows } = await query(
    `INSERT INTO tasks (title, description, status, priority, due_date, user_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [title.trim(), description?.trim() || null, status, priority, due_date || null, req.user.id],
  );

  return sendSuccess(res, { task: rows[0] }, 'Task created', 201);
});

const getTasks = asyncHandler(async (req, res) => {
  const { status, priority, page = 1, limit = 10, search } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const isAdmin = req.user.role === 'admin';

  const conditions = [];
  const params = [];
  let idx = 1;

  if (!isAdmin) {
    conditions.push(`t.user_id = $${idx++}`);
    params.push(req.user.id);
  }
  if (status) {
    conditions.push(`t.status = $${idx++}`);
    params.push(status);
  }
  if (priority) {
    conditions.push(`t.priority = $${idx++}`);
    params.push(priority);
  }
  if (search) {
    conditions.push(`(t.title ILIKE $${idx} OR t.description ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRes = await query(
    `SELECT COUNT(*) FROM tasks t ${whereClause}`,
    params,
  );
  const total = parseInt(countRes.rows[0].count);

  const taskRes = await query(
    `SELECT t.*, u.name AS owner_name, u.email AS owner_email
     FROM tasks t
     JOIN users u ON t.user_id = u.id
     ${whereClause}
     ORDER BY t.created_at DESC
     LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, parseInt(limit), offset],
  );

  return sendSuccess(res, {
    tasks: taskRes.rows,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  }, 'Tasks fetched');
});

const getTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isAdmin = req.user.role === 'admin';

  const { rows } = await query(
    `SELECT t.*, u.name AS owner_name, u.email AS owner_email
     FROM tasks t
     JOIN users u ON t.user_id = u.id
     WHERE t.id = $1 ${isAdmin ? '' : 'AND t.user_id = $2'}`,
    isAdmin ? [id] : [id, req.user.id],
  );

  if (!rows.length) return sendError(res, 'Task not found', 404);
  return sendSuccess(res, { task: rows[0] }, 'Task fetched');
});

const updateTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, status, priority, due_date } = req.body;
  const isAdmin = req.user.role === 'admin';

  const { rows: existing } = await query(
    `SELECT id FROM tasks WHERE id = $1 ${isAdmin ? '' : 'AND user_id = $2'}`,
    isAdmin ? [id] : [id, req.user.id],
  );
  if (!existing.length) return sendError(res, 'Task not found', 404);

  const { rows } = await query(
    `UPDATE tasks SET
       title       = COALESCE($1, title),
       description = COALESCE($2, description),
       status      = COALESCE($3, status),
       priority    = COALESCE($4, priority),
       due_date    = COALESCE($5, due_date)
     WHERE id = $6
     RETURNING *`,
    [
      title?.trim()       || null,
      description?.trim() || null,
      status              || null,
      priority            || null,
      due_date            || null,
      id,
    ],
  );

  return sendSuccess(res, { task: rows[0] }, 'Task updated');
});

const deleteTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isAdmin = req.user.role === 'admin';

  const { rows } = await query(
    `DELETE FROM tasks WHERE id = $1 ${isAdmin ? '' : 'AND user_id = $2'} RETURNING id`,
    isAdmin ? [id] : [id, req.user.id],
  );
  if (!rows.length) return sendError(res, 'Task not found', 404);
  return sendSuccess(res, {}, 'Task deleted');
});

const getTaskStats = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT
       COUNT(*)                                       AS total,
       COUNT(*) FILTER (WHERE status = 'pending')     AS pending,
       COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress,
       COUNT(*) FILTER (WHERE status = 'completed')   AS completed,
       COUNT(*) FILTER (WHERE status = 'cancelled')   AS cancelled,
       COUNT(*) FILTER (WHERE priority = 'high')      AS high_priority
     FROM tasks
     WHERE user_id = $1`,
    [req.user.id],
  );
  return sendSuccess(res, { stats: rows[0] }, 'Stats fetched');
});

module.exports = { createTask, getTasks, getTask, updateTask, deleteTask, getTaskStats };

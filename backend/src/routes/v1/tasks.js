const router = require('express').Router();
const { body, param, query } = require('express-validator');
const { verifyToken } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const {
  createTask, getTasks, getTask,
  updateTask, deleteTask, getTaskStats,
} = require('../../controllers/taskController');

router.use(verifyToken);

const taskCreateRules = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
  body('description').optional().isLength({ max: 2000 }),
  body('status').optional().isIn(['pending', 'in_progress', 'completed', 'cancelled']),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('due_date').optional().isDate().withMessage('due_date must be a valid date (YYYY-MM-DD)'),
];

const taskUpdateRules = [
  param('id').isUUID().withMessage('Invalid task ID'),
  body('title').optional().trim().notEmpty().isLength({ max: 200 }),
  body('description').optional().isLength({ max: 2000 }),
  body('status').optional().isIn(['pending', 'in_progress', 'completed', 'cancelled']),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('due_date').optional().isDate(),
];

/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: Task CRUD operations
 */

/**
 * @swagger
 * /api/v1/tasks:
 *   get:
 *     summary: Get all tasks (own tasks; admin gets all)
 *     tags: [Tasks]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, in_progress, completed, cancelled] }
 *       - in: query
 *         name: priority
 *         schema: { type: string, enum: [low, medium, high] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: List of tasks with pagination
 */
router.get('/', getTasks);

/**
 * @swagger
 * /api/v1/tasks/stats:
 *   get:
 *     summary: Get task statistics for the current user
 *     tags: [Tasks]
 *     responses:
 *       200:
 *         description: Task counts by status & priority
 */
router.get('/stats', getTaskStats);

/**
 * @swagger
 * /api/v1/tasks/{id}:
 *   get:
 *     summary: Get a single task by ID
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Task object
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Task' }
 *       404:
 *         description: Task not found
 */
router.get('/:id', [param('id').isUUID()], validate, getTask);

/**
 * @swagger
 * /api/v1/tasks:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:       { type: string, example: Build the API }
 *               description: { type: string }
 *               status:      { type: string, enum: [pending, in_progress, completed, cancelled] }
 *               priority:    { type: string, enum: [low, medium, high] }
 *               due_date:    { type: string, format: date, example: '2025-12-31' }
 *     responses:
 *       201:
 *         description: Task created
 *       422:
 *         description: Validation error
 */
router.post('/', taskCreateRules, validate, createTask);

/**
 * @swagger
 * /api/v1/tasks/{id}:
 *   patch:
 *     summary: Update a task (partial update)
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:       { type: string }
 *               description: { type: string }
 *               status:      { type: string, enum: [pending, in_progress, completed, cancelled] }
 *               priority:    { type: string, enum: [low, medium, high] }
 *               due_date:    { type: string, format: date }
 *     responses:
 *       200:
 *         description: Task updated
 *       404:
 *         description: Task not found
 */
router.patch('/:id', taskUpdateRules, validate, updateTask);

/**
 * @swagger
 * /api/v1/tasks/{id}:
 *   delete:
 *     summary: Delete a task
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Task deleted }
 *       404: { description: Task not found }
 */
router.delete('/:id', [param('id').isUUID()], validate, deleteTask);

module.exports = router;

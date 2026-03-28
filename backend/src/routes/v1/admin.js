const router = require('express').Router();
const { body, param } = require('express-validator');
const { verifyToken, requireRole } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { getAllUsers, updateUser, deleteUser, getStats } = require('../../controllers/adminController');

router.use(verifyToken, requireRole('admin'));

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin-only endpoints (role=admin required)
 */

/**
 * @swagger
 * /api/v1/admin/stats:
 *   get:
 *     summary: Get platform-wide statistics
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: User and task statistics
 *       403:
 *         description: Admin role required
 */
router.get('/stats', getStats);

/**
 * @swagger
 * /api/v1/admin/users:
 *   get:
 *     summary: List all users
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [user, admin] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated user list
 */
router.get('/users', getAllUsers);

/**
 * @swagger
 * /api/v1/admin/users/{id}:
 *   patch:
 *     summary: Update user role or active status
 *     tags: [Admin]
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
 *               role:      { type: string, enum: [user, admin] }
 *               is_active: { type: boolean }
 *     responses:
 *       200: { description: User updated }
 *       400: { description: Cannot modify own account }
 *       404: { description: User not found }
 */
router.patch(
  '/users/:id',
  [
    param('id').isUUID(),
    body('role').optional().isIn(['user', 'admin']),
    body('is_active').optional().isBoolean(),
  ],
  validate,
  updateUser,
);

/**
 * @swagger
 * /api/v1/admin/users/{id}:
 *   delete:
 *     summary: Delete a user (cascades to their tasks)
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: User deleted }
 *       404: { description: User not found }
 */
router.delete('/users/:id', [param('id').isUUID()], validate, deleteUser);

module.exports = router;

const router = require('express').Router();
const authRoutes  = require('./v1/auth');
const taskRoutes  = require('./v1/tasks');
const adminRoutes = require('./v1/admin');

router.use('/v1/auth',  authRoutes);
router.use('/v1/tasks', taskRoutes);
router.use('/v1/admin', adminRoutes);

router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;

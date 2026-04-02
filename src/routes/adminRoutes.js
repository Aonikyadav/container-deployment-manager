const express = require('express');
const router = express.Router();
const { getSystemStats, getDetailedUsers } = require('../controllers/adminController');
const { protect, admin } = require('../middlewares/authMiddleware');

/**
 * @route GET /api/admin/stats
 * @desc Get overall system statistics
 * @access Private/Admin
 */
router.get('/stats', protect, admin, getSystemStats);

/**
 * @route GET /api/admin/users
 * @desc Get detailed list of users and their deployments
 * @access Private/Admin
 */
router.get('/users', protect, admin, getDetailedUsers);

module.exports = router;

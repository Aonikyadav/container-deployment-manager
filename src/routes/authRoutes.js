const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const authController = require('../controllers/authController');

router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser);
router.get('/me', protect, authController.getMe);

module.exports = router;

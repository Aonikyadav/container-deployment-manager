// middlewares/authMiddleware.js

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'rudrika_super_secret_key');
      req.user = await User.findById(decoded.id).select('-password');
      return next();
    } catch (error) {
      console.error('JWT Error:', error.message);
      return res.status(401).json({ error: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authorized, no token found. Intruder blocked.' });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin' && req.user.email === 'admin@deployment.com') {
    next();
  } else {
    res.status(403).json({ error: 'Not authorized as an administrator. Access denied. Only root admin is allowed.' });
  }
};
module.exports = { protect, admin };

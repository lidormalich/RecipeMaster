const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Optional auth middleware - sets req.user if token exists, but doesn't block if missing
const optionalAuth = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    // No token - continue without user
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.user.id).select('-password');
    if (!user || user.suspended) {
      req.user = null;
      return next();
    }

    req.user = {
      id: user._id,
      _id: user._id,
      role: user.role,
      name: user.name,
      email: user.email,
    };
    next();
  } catch (err) {
    // Invalid token - continue without user
    req.user = null;
    next();
  }
};

module.exports = optionalAuth;

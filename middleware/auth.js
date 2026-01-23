const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({message: 'No token, authorization denied'});
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user from database to get role and other info
    const user = await User.findById(decoded.user.id).select('-password');
    if (!user) {
      return res.status(401).json({message: 'User not found'});
    }

    // Check if user is suspended
    if (user.suspended) {
      return res.status(403).json({message: 'Account suspended'});
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
    res.status(401).json({message: 'Token is not valid'});
  }
};

module.exports = auth;

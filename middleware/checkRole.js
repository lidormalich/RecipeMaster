const auth = require('./auth');

const checkRole = roles => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({message: 'No token, authorization denied'});
    }

    // Case-insensitive role check
    const userRole = req.user.role?.toLowerCase();
    const allowedRoles = roles.map(r => r.toLowerCase());

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({message: 'Access denied'});
    }

    next();
  };
};

module.exports = checkRole;

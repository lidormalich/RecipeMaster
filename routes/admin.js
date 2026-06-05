const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

router.get(
  '/users',
  auth,
  checkRole(['Admin']),
  adminController.getAllUsers,
);

router.patch(
  '/role',
  auth,
  checkRole(['Admin']),
  adminController.updateUserRole,
);

router.patch(
  '/suspend',
  auth,
  checkRole(['Admin']),
  adminController.suspendUser,
);

router.patch(
  '/reset-password',
  auth,
  checkRole(['Admin']),
  adminController.resetPassword,
);

router.delete(
  '/users/:userId',
  auth,
  checkRole(['Admin']),
  adminController.deleteUser,
);

router.get(
  '/audit-log',
  auth,
  checkRole(['Admin']),
  adminController.getAuditLog,
);

router.get(
  '/export/users.csv',
  auth,
  checkRole(['Admin']),
  adminController.exportUsersCsv,
);

module.exports = router;

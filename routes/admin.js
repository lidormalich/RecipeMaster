const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

router.patch(
  '/role',
  auth,
  checkRole(['Admin']),
  adminController.updateUserRole,
);

module.exports = router;

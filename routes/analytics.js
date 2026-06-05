const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

// All analytics endpoints are Admin-only
router.get('/overview', auth, checkRole(['Admin']), analyticsController.getOverview);
router.get('/live', auth, checkRole(['Admin']), analyticsController.getLive);
router.post(
  '/recompute-badges',
  auth,
  checkRole(['Admin']),
  analyticsController.recomputeBadges,
);

module.exports = router;

const express = require('express');
const router = express.Router();
const groqController = require('../controllers/groqController');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

// Get usage statistics - Admin only
router.get('/usage', auth, checkRole(['Admin']), groqController.getUsage);

// Get available months for history - Admin only
router.get('/available-months', auth, checkRole(['Admin']), groqController.getAvailableMonths);

module.exports = router;

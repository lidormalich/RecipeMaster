const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

// Any logged-in user can submit a report
router.post('/', auth, reportController.createReport);

// Admin-only review endpoints
router.get('/', auth, checkRole(['Admin']), reportController.getReports);
router.patch('/:id', auth, checkRole(['Admin']), reportController.updateReport);

module.exports = router;

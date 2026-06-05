const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

// Public: the active banner for all visitors
router.get('/active', announcementController.getActive);

// Admin management
router.get('/', auth, checkRole(['Admin']), announcementController.list);
router.post('/', auth, checkRole(['Admin']), announcementController.create);
router.patch('/:id', auth, checkRole(['Admin']), announcementController.update);
router.delete('/:id', auth, checkRole(['Admin']), announcementController.remove);

module.exports = router;

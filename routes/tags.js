const express = require('express');
const router = express.Router();
const tagController = require('../controllers/tagController');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

router.get('/', tagController.getTags);
router.post('/', auth, checkRole(['Admin', 'Poster']), tagController.createTag);
router.put('/:id', auth, tagController.updateTag);
router.delete('/:id', auth, tagController.deleteTag);

module.exports = router;

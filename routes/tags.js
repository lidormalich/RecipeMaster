const express = require('express');
const router = express.Router();
const tagController = require('../controllers/tagController');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

// Get all tags (grouped by categories)
router.get('/', tagController.getTags);

// Quick tag creation (for comma-separated input)
router.post('/quick', auth, checkRole(['Admin', 'Poster']), tagController.quickCreateTag);

// Create a new category with tags
router.post('/', auth, checkRole(['Admin', 'Poster']), tagController.createTag);

// Update tag (edit name, category)
router.put('/:id', auth, checkRole(['Admin']), tagController.updateTag);

// Delete tag
router.delete('/:id', auth, checkRole(['Admin']), tagController.deleteTag);

// Search tags by query
router.get('/search', tagController.searchTags);

// Get tag recommendations based on selected tags
router.get('/recommend', tagController.recommendTags);

// AI auto-generate tags based on recipe content
router.post('/generate-ai', auth, tagController.generateTagsAI);

module.exports = router;

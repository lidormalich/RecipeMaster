const express = require('express');
const router = express.Router();
const recipeController = require('../controllers/recipeController');
const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const multer = require('multer');
const upload = multer({dest: 'uploads/'});

router.get('/', optionalAuth, recipeController.getRecipes);

// AI Smart Assistant
router.post('/ai-recommend', recipeController.aiRecommend);
router.get('/available-tags', recipeController.getAvailableTags);
router.post('/search-by-tags', recipeController.searchByTags);

// User routes (Specific routes must come before /:userId or /:shortId)
router.get('/user/recommendations', auth, recipeController.getRecommendations);
router.get('/user/cart', auth, recipeController.getCart);
router.get('/user/:userId', optionalAuth, recipeController.getUserRecipes);

// Deleted recipes routes
router.get('/deleted/all', auth, recipeController.getDeletedRecipes);
router.patch('/:shortId/restore', auth, recipeController.restoreRecipe);
router.delete('/:shortId/permanent', auth, recipeController.permanentDeleteRecipe);

// ShortId routes
router.get('/:shortId', optionalAuth, recipeController.getRecipe);
router.post('/', auth, upload.array('images'), recipeController.createRecipe);
router.put('/:shortId', auth, recipeController.updateRecipe);
router.delete('/:shortId', auth, recipeController.deleteRecipe);
router.post('/:shortId/cart', auth, recipeController.addToCart);
router.delete('/:shortId/cart', auth, recipeController.removeFromCart);

module.exports = router;

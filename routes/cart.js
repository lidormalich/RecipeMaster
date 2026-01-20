const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const auth = require('../middleware/auth');

// @route   GET /api/cart
// @desc    קבלת סל הקניות של המשתמש
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let cart = await Cart.findOne({user: req.user.id}).populate(
      'items.recipe',
      'title shortId',
    );

    if (!cart) {
      cart = await Cart.create({user: req.user.id, items: []});
    }

    res.json(cart);
  } catch (err) {
    console.error(err);
    res.status(500).json({msg: 'שגיאת שרת'});
  }
});

// @route   POST /api/cart/add
// @desc    הוספת מרכיבים מהמתכון לסל
// @access  Private
router.post('/add', auth, async (req, res) => {
  try {
    const {ingredients, recipeId, recipeTitle, shortId} = req.body;

    if (!ingredients || !Array.isArray(ingredients)) {
      return res.status(400).json({msg: 'נדרש מערך מרכיבים'});
    }

    let cart = await Cart.findOne({user: req.user.id});

    if (!cart) {
      cart = new Cart({user: req.user.id, items: []});
    }

    // הוספת כל מרכיב לסל
    ingredients.forEach(ingredient => {
      if (ingredient.trim()) {
        cart.items.push({
          ingredient: ingredient.trim(),
          recipe: recipeId,
          recipeTitle: recipeTitle,
          shortId: shortId,
        });
      }
    });

    await cart.save();

    res.json({
      msg: `${ingredients.length} מרכיבים נוספו לסל הקניות`,
      cart,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({msg: 'שגיאת שרת'});
  }
});

// @route   DELETE /api/cart/:itemId
// @desc    מחיקת פריט מהסל
// @access  Private
router.delete('/:itemId', auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({user: req.user.id});

    if (!cart) {
      return res.status(404).json({msg: 'הסל לא נמצא'});
    }

    cart.items = cart.items.filter(
      item => item._id.toString() !== req.params.itemId,
    );

    await cart.save();

    res.json({msg: 'הפריט נמחק', cart});
  } catch (err) {
    console.error(err);
    res.status(500).json({msg: 'שגיאת שרת'});
  }
});

// @route   DELETE /api/cart/clear
// @desc    ניקוי כל הסל
// @access  Private
router.delete('/clear/all', auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({user: req.user.id});

    if (!cart) {
      return res.status(404).json({msg: 'הסל לא נמצא'});
    }

    cart.items = [];
    await cart.save();

    res.json({msg: 'הסל נוקה', cart});
  } catch (err) {
    console.error(err);
    res.status(500).json({msg: 'שגיאת שרת'});
  }
});

module.exports = router;

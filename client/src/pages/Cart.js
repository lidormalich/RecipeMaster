const mongoose = require('mongoose');

const CartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  items: [
    {
      ingredient: {
        type: String,
        required: true,
      },
      recipe: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Recipe',
      },
      recipeTitle: String,
      shortId: String,
    },
  ],
});

module.exports = mongoose.model('Cart', CartSchema);

const Recipe = require('../models/Recipe');
const User = require('../models/User');
const Cart = require('../models/Cart');
const cloudinary = require('cloudinary').v2;

exports.getRecipes = async (req, res) => {
  try {
    const {search, tags, author} = req.query;
    let query = {isDeleted: false, visibility: 'Public'};

    if (search) {
      query.$or = [
        {title: {$regex: search, $options: 'i'}},
        {description: {$regex: search, $options: 'i'}},
        {ingredients: {$regex: search, $options: 'i'}},
        {instructions: {$regex: search, $options: 'i'}},
      ];
    }

    if (tags) {
      query.tags = {$in: tags.split(',')};
    }

    if (author) {
      query.author = author;
    }

    const recipes = await Recipe.find(query)
      .populate('author', 'name')
      .populate('tags', 'name')
      .sort({createdAt: -1});

    res.json(recipes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.addToCart = async (req, res) => {
  try {
    const {shortId} = req.params;
    const recipe = await Recipe.findOne({shortId});

    if (!recipe) {
      return res.status(404).json({message: 'Recipe not found'});
    }

    let cart = await Cart.findOne({user: req.user.id});
    if (!cart) {
      cart = new Cart({user: req.user.id, items: []});
    }

    let ingredientsToAdd = [];
    if (Array.isArray(recipe.ingredients)) {
      ingredientsToAdd = recipe.ingredients;
    } else if (typeof recipe.ingredients === 'string') {
      ingredientsToAdd = [recipe.ingredients];
    }

    ingredientsToAdd.forEach(ing => {
      const exists = cart.items.some(
        item => item.shortId === shortId && item.ingredient === ing,
      );
      if (!exists && ing && ing.trim() !== '') {
        cart.items.push({
          ingredient: ing,
          recipe: recipe._id,
          recipeTitle: recipe.title,
          shortId: recipe.shortId,
        });
      }
    });

    await cart.save();
    res.json(cart.items);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.removeFromCart = async (req, res) => {
  try {
    const {shortId} = req.params;
    const {ingredient} = req.body;

    const cart = await Cart.findOne({user: req.user.id});
    if (!cart) {
      return res.status(404).json({message: 'Cart not found'});
    }

    cart.items = cart.items.filter(
      item => !(item.shortId === shortId && item.ingredient === ingredient),
    );

    await cart.save();
    res.json(cart.items);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({user: req.user.id});
    res.json(cart ? cart.items : []);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.getRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findOne({shortId: req.params.shortId})
      .populate('author', 'name email')
      .populate('tags', 'name');

    if (!recipe || recipe.isDeleted) {
      return res.status(404).json({message: 'Recipe not found'});
    }

    if (
      recipe.visibility === 'Private' &&
      (!req.user || req.user.id !== recipe.author.id)
    ) {
      return res.status(403).json({message: 'Access denied'});
    }

    res.json(recipe);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.createRecipe = async (req, res) => {
  const {
    title,
    description,
    ingredients,
    instructions,
    mainImage,
    additionalImages,
    videoUrl,
    tags,
    visibility,
    allowComments,
  } = req.body;

  try {
    const {nanoid} = await import('nanoid');
    const shortId = nanoid(8);

    let processedTags = [];
    if (tags) {
      if (typeof tags === 'string') {
        try {
          const parsed = JSON.parse(tags);
          if (Array.isArray(parsed)) {
            processedTags = parsed.filter(t => t && t.trim() !== '');
          }
        } catch (e) {
          processedTags = tags
            .split(',')
            .map(t => t.trim())
            .filter(t => t !== '');
        }
      } else if (Array.isArray(tags)) {
        processedTags = tags.filter(t => t && t.trim() !== '');
      }
    }

    const recipe = new Recipe({
      shortId,
      title,
      description,
      ingredients,
      instructions,
      mainImage,
      additionalImages,
      videoUrl,
      tags: processedTags,
      author: req.user.id,
      visibility,
      allowComments,
    });

    await recipe.save();
    await recipe.populate('author', 'name');
    await recipe.populate('tags', 'name');

    res.json(recipe);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.updateRecipe = async (req, res) => {
  try {
    let recipe = await Recipe.findOne({shortId: req.params.shortId});

    if (!recipe) {
      return res.status(404).json({message: 'Recipe not found'});
    }

    if (recipe.author.toString() !== req.user.id) {
      return res.status(403).json({message: 'Access denied'});
    }

    recipe = await Recipe.findOneAndUpdate(
      {shortId: req.params.shortId},
      req.body,
      {
        new: true,
      },
    )
      .populate('author', 'name')
      .populate('tags', 'name');

    res.json(recipe);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.deleteRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findOne({shortId: req.params.shortId});

    if (!recipe) {
      return res.status(404).json({message: 'Recipe not found'});
    }

    if (recipe.author.toString() !== req.user.id) {
      return res.status(403).json({message: 'Access denied'});
    }

    recipe.isDeleted = true;
    await recipe.save();

    res.json({message: 'Recipe deleted'});
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.getUserRecipes = async (req, res) => {
  try {
    const recipes = await Recipe.find({
      author: req.params.userId,
      isDeleted: false,
    })
      .populate('author', 'name')
      .populate('tags', 'name')
      .sort({createdAt: -1});

    res.json(recipes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.getRecommendations = async (req, res) => {
  try {
    const {tags, count = 3} = req.query;

    // If specific tags provided, use them
    if (tags) {
      const tagsArray = tags.split(',');

      // Find recipes with matching tags
      const recipes = await Recipe.aggregate([
        {
          $match: {
            isDeleted: false,
            visibility: 'Public',
            tags: {$in: tagsArray},
          },
        },
        {
          $addFields: {
            matchCount: {
              $size: {
                $setIntersection: ['$tags', tagsArray],
              },
            },
          },
        },
        {$sort: {matchCount: -1, createdAt: -1}},
        {$limit: parseInt(count)},
      ]);

      // Populate author info
      await Recipe.populate(recipes, {path: 'author', select: 'name'});

      return res.json(recipes);
    }

    // Otherwise, recommend based on user's past recipes
    if (req.user) {
      const userRecipes = await Recipe.find({
        author: req.user.id,
        isDeleted: false,
      });

      const userTags = [
        ...new Set(userRecipes.flatMap(r => r.tags || [])),
      ];

      const recommendations = await Recipe.find({
        isDeleted: false,
        visibility: 'Public',
        tags: {$in: userTags},
        author: {$ne: req.user.id},
      })
        .populate('author', 'name')
        .limit(parseInt(count));

      return res.json(recommendations);
    }

    // Default: return random popular recipes
    const randomRecipes = await Recipe.aggregate([
      {
        $match: {
          isDeleted: false,
          visibility: 'Public',
        },
      },
      {$sample: {size: parseInt(count)}},
    ]);

    await Recipe.populate(randomRecipes, {path: 'author', select: 'name'});

    res.json(randomRecipes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

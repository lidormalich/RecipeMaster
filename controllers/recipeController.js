const Recipe = require('../models/Recipe');
const User = require('../models/User');
const Cart = require('../models/Cart');
const Tag = require('../models/Tag');
const cloudinary = require('cloudinary').v2;
const {groqWithTracking} = require('./groqController');

// Helper function to populate tags from globalIds
const populateTagsFromGlobalIds = async recipe => {
  if (!recipe || !recipe.tags || recipe.tags.length === 0) {
    return recipe;
  }

  // Normalize tags to numbers for consistent comparison
  const normalizedTags = recipe.tags.map(t => Number(t));

  // Get all tag categories that contain any of these globalIds
  const tagCategories = await Tag.find({
    'tags.globalId': {$in: normalizedTags},
  });

  // Build a map of globalId to tag info
  const tagMap = {};
  tagCategories.forEach(cat => {
    cat.tags.forEach(tag => {
      if (normalizedTags.includes(tag.globalId)) {
        tagMap[tag.globalId] = {
          _id: tag._id,
          globalId: tag.globalId,
          name: tag.he,
          nameEn: tag.en,
          category: cat.category,
        };
      }
    });
  });

  // Convert recipe to object if needed and add populated tags
  const recipeObj = recipe.toObject ? recipe.toObject() : {...recipe};
  recipeObj.populatedTags = normalizedTags
    .map(globalId => tagMap[globalId])
    .filter(Boolean);

  return recipeObj;
};

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
      .sort({createdAt: -1});

    const recipesWithTags = await Promise.all(
      recipes.map(recipe => populateTagsFromGlobalIds(recipe)),
    );

    res.json(recipesWithTags);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.addToCart = async (req, res) => {
  try {
    const {shortId} = req.params;
    const recipe = await Recipe.findOne({shortId: {$regex: new RegExp(`^${shortId}$`, 'i')}});

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
    const recipe = await Recipe.findOne({shortId: {$regex: new RegExp(`^${req.params.shortId}$`, 'i')}}).populate(
      'author',
      'name email',
    );

    if (!recipe || recipe.isDeleted) {
      return res.status(404).json({message: 'Recipe not found'});
    }

    // Check access for private recipes - owner can always access
    if (recipe.visibility === 'Private') {
      const authorId = recipe.author._id?.toString() || recipe.author.toString();
      const userId = req.user?.id?.toString() || req.user?._id?.toString();

      if (!userId || userId !== authorId) {
        return res.status(403).json({message: 'Access denied'});
      }
    }

    // Populate tags from globalIds
    const recipeWithTags = await populateTagsFromGlobalIds(recipe);

    res.json(recipeWithTags);
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
            processedTags = parsed.filter(t => t && String(t).trim() !== '');
          }
        } catch (e) {
          processedTags = tags
            .split(',')
            .map(t => t.trim())
            .filter(t => t !== '');
        }
      } else if (Array.isArray(tags)) {
        processedTags = tags.filter(t => t && String(t).trim() !== '');
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

// Helper to check if user can edit any recipe
const canEditAnyRecipe = userRole => {
  const role = userRole?.toLowerCase();
  return role === 'admin' || role === 'posteradmin';
};

exports.updateRecipe = async (req, res) => {
  try {
    const shortIdRegex = {$regex: new RegExp(`^${req.params.shortId}$`, 'i')};
    let recipe = await Recipe.findOne({shortId: shortIdRegex});

    if (!recipe) {
      return res.status(404).json({message: 'Recipe not found'});
    }

    // Allow edit if: owner OR Admin/PosterAdmin
    const isOwner = recipe.author.toString() === req.user.id;
    const hasEditPermission = canEditAnyRecipe(req.user.role);

    if (!isOwner && !hasEditPermission) {
      return res.status(403).json({message: 'Access denied'});
    }

    recipe = await Recipe.findOneAndUpdate(
      {shortId: shortIdRegex},
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
    const recipe = await Recipe.findOne({shortId: {$regex: new RegExp(`^${req.params.shortId}$`, 'i')}});

    if (!recipe) {
      return res.status(404).json({message: 'Recipe not found'});
    }

    // Allow delete if: owner OR Admin/PosterAdmin
    const isOwner = recipe.author.toString() === req.user.id;
    const hasDeletePermission = canEditAnyRecipe(req.user.role);

    if (!isOwner && !hasDeletePermission) {
      return res.status(403).json({message: 'Access denied'});
    }

    recipe.isDeleted = true;
    recipe.deletedBy = req.user.id;
    recipe.deletedAt = new Date();
    await recipe.save();

    res.json({message: 'Recipe deleted'});
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.getUserRecipes = async (req, res) => {
  try {
    const requestedUserId = req.params.userId;
    const currentUserId = req.user?.id?.toString() || req.user?._id?.toString();

    // Check if viewing own recipes
    const isOwnProfile = currentUserId && currentUserId === requestedUserId;

    let query = {
      author: requestedUserId,
      isDeleted: false,
    };

    // If not viewing own profile, only show public recipes
    if (!isOwnProfile) {
      query.visibility = 'Public';
    }

    const recipes = await Recipe.find(query)
      .populate('author', 'name')
      .sort({createdAt: -1});

    // Populate tags from globalIds
    const recipesWithTags = await Promise.all(
      recipes.map(recipe => populateTagsFromGlobalIds(recipe)),
    );

    res.json(recipesWithTags);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Get deleted recipes - for regular users: only their own, for admin/posteradmin: all deleted
exports.getDeletedRecipes = async (req, res) => {
  try {
    const userRole = req.user.role?.toLowerCase();
    const isAdmin = userRole === 'admin' || userRole === 'posteradmin';

    let query = {isDeleted: true};

    // Regular users can only see their own deleted recipes
    if (!isAdmin) {
      query.author = req.user.id;
    }

    const recipes = await Recipe.find(query)
      .populate('author', 'name')
      .populate('deletedBy', 'name')
      .sort({deletedAt: -1});

    const recipesWithTags = await Promise.all(
      recipes.map(recipe => populateTagsFromGlobalIds(recipe)),
    );

    res.json(recipesWithTags);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Restore a deleted recipe
exports.restoreRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findOne({shortId: {$regex: new RegExp(`^${req.params.shortId}$`, 'i')}});

    if (!recipe) {
      return res.status(404).json({message: 'Recipe not found'});
    }

    if (!recipe.isDeleted) {
      return res.status(400).json({message: 'Recipe is not deleted'});
    }

    // Allow restore if: owner OR Admin/PosterAdmin
    const isOwner = recipe.author.toString() === req.user.id;
    const hasRestorePermission = canEditAnyRecipe(req.user.role);

    if (!isOwner && !hasRestorePermission) {
      return res.status(403).json({message: 'Access denied'});
    }

    recipe.isDeleted = false;
    recipe.deletedBy = null;
    recipe.deletedAt = null;
    await recipe.save();

    res.json({message: 'Recipe restored successfully'});
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Permanently delete a recipe (Admin/PosterAdmin only)
exports.permanentDeleteRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findOne({shortId: {$regex: new RegExp(`^${req.params.shortId}$`, 'i')}});

    if (!recipe) {
      return res.status(404).json({message: 'Recipe not found'});
    }

    // Only Admin/PosterAdmin can permanently delete
    const hasPermission = canEditAnyRecipe(req.user.role);

    if (!hasPermission) {
      return res.status(403).json({message: 'Access denied - Admin only'});
    }

    // Delete images from cloudinary if they exist
    if (recipe.mainImage) {
      const publicId = recipe.mainImage.split('/').pop().split('.')[0];
      try {
        await cloudinary.uploader.destroy(`recipes/${publicId}`);
      } catch (cloudErr) {
        console.error('Error deleting main image from cloudinary:', cloudErr);
      }
    }

    if (recipe.additionalImages && recipe.additionalImages.length > 0) {
      for (const img of recipe.additionalImages) {
        const publicId = img.split('/').pop().split('.')[0];
        try {
          await cloudinary.uploader.destroy(`recipes/${publicId}`);
        } catch (cloudErr) {
          console.error('Error deleting additional image from cloudinary:', cloudErr);
        }
      }
    }

    await Recipe.findByIdAndDelete(recipe._id);

    res.json({message: 'Recipe permanently deleted'});
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

      const userTags = [...new Set(userRecipes.flatMap(r => r.tags || []))];

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

// ========== AI SMART ASSISTANT ==========

// Cache for recipes summary (to avoid sending full recipes to AI)
let recipesCache = {
  data: null,
  summary: null,
  lastUpdated: null,
  TTL: 5 * 60 * 1000, // 5 minutes
};

async function getRecipesSummary() {
  const now = Date.now();

  if (recipesCache.data && recipesCache.lastUpdated && now - recipesCache.lastUpdated < recipesCache.TTL) {
    return recipesCache;
  }

  // Get all public recipes with their tags populated
  const recipes = await Recipe.find({isDeleted: false, visibility: 'Public'})
    .select('_id shortId title description tags')
    .lean();

  // Get all tags for name lookup
  const tagCategories = await Tag.find().lean();
  const tagMap = {};
  tagCategories.forEach(cat => {
    cat.tags.forEach(tag => {
      tagMap[tag.globalId] = tag.he;
    });
  });

  // Build compact summary for AI
  const summary = recipes.map(r => ({
    id: r.shortId,
    title: r.title,
    desc: r.description?.substring(0, 100) || '',
    tags: (r.tags || []).map(t => tagMap[t] || '').filter(Boolean).join(', '),
  }));

  recipesCache = {
    data: recipes,
    summary,
    lastUpdated: now,
    TTL: 5 * 60 * 1000,
  };

  return recipesCache;
}

// AI Smart Recommendation
exports.aiRecommend = async (req, res) => {
  try {
    const {query, mode = 'chat', ingredients = []} = req.body;

    if (!query && mode !== 'surprise') {
      return res.status(400).json({message: 'Query is required'});
    }

    const cache = await getRecipesSummary();

    if (cache.summary.length === 0) {
      return res.json({recipes: [], message: 'אין מתכונים במערכת'});
    }

    // Mode: Surprise - return random recipes
    if (mode === 'surprise') {
      const shuffled = [...cache.data].sort(() => 0.5 - Math.random());
      const randomRecipes = shuffled.slice(0, 3);

      const populatedRecipes = await Recipe.find({
        shortId: {$in: randomRecipes.map(r => r.shortId)},
      })
        .populate('author', 'name')
        .lean();

      const withTags = await Promise.all(
        populatedRecipes.map(r => populateTagsFromGlobalIds(r))
      );

      return res.json({
        recipes: withTags,
        message: 'הנה כמה הפתעות טעימות!',
        aiResponse: 'בחרתי עבורך מתכונים אקראיים מהאוסף שלנו. בתאבון! 🎲',
      });
    }

    // Build context based on mode
    let systemPrompt = `אתה עוזר מתכונים חכם וידידותי בשם "שף AI".
תפקידך לעזור למשתמשים למצוא מתכונים מתאימים מתוך רשימה קיימת.
תמיד תענה בעברית, בצורה חמה וידידותית, עם אימוג'ים.
אם אין מתכונים מתאימים - הצע חלופות קרובות.`;

    let userPrompt = '';

    if (mode === 'ingredients') {
      // Mode: What's in the fridge
      systemPrompt += `\n\nהמשתמש מחפש מתכונים לפי רכיבים שיש לו.
התאם מתכונים שמכילים כמה שיותר מהרכיבים האלה.`;

      userPrompt = `הרכיבים שיש לי: ${ingredients.join(', ')}

${query ? `העדפות נוספות: ${query}` : ''}

רשימת המתכונים הזמינים:
${cache.summary.map(r => `- [${r.id}] ${r.title} (${r.tags})`).join('\n')}

בחר 3-5 מתכונים המתאימים ביותר לרכיבים שלי.
החזר JSON: {"selectedIds": ["id1", "id2"], "explanation": "הסבר קצר"}`;

    } else {
      // Mode: Chat (free text)
      userPrompt = `בקשת המשתמש: "${query}"

רשימת המתכונים הזמינים:
${cache.summary.map(r => `- [${r.id}] ${r.title} (${r.tags})`).join('\n')}

בחר 3-5 מתכונים המתאימים ביותר לבקשה.
החזר JSON: {"selectedIds": ["id1", "id2"], "explanation": "הסבר קצר וחם עם אימוג'ים"}`;
    }

    // Use groqWithTracking for usage monitoring
    const completion = await groqWithTracking(
      [
        {role: 'system', content: systemPrompt},
        {role: 'user', content: userPrompt},
      ],
      'llama-3.3-70b-versatile',
      {temperature: 0.5, max_tokens: 500},
      'ai-recommend'
    );

    const responseText = completion.choices[0]?.message?.content || '';

    // Parse AI response
    let selectedIds = [];
    let explanation = 'מצאתי לך כמה מתכונים מעניינים!';

    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        selectedIds = parsed.selectedIds || [];
        explanation = parsed.explanation || explanation;
      }
    } catch (e) {
      console.error('Error parsing AI response:', e);
      // Fallback: try to extract IDs from text
      const idMatches = responseText.match(/\[([a-zA-Z0-9]+)\]/g);
      if (idMatches) {
        selectedIds = idMatches.map(m => m.replace(/[\[\]]/g, ''));
      }
    }

    // Get full recipes
    const recipes = await Recipe.find({
      shortId: {$in: selectedIds},
      isDeleted: false,
    })
      .populate('author', 'name')
      .lean();

    // Populate tags
    const recipesWithTags = await Promise.all(
      recipes.map(r => populateTagsFromGlobalIds(r))
    );

    // Sort by the order AI returned
    const sortedRecipes = selectedIds
      .map(id => recipesWithTags.find(r => r.shortId === id))
      .filter(Boolean);

    res.json({
      recipes: sortedRecipes,
      message: explanation,
      aiResponse: explanation,
    });

  } catch (err) {
    console.error('AI Recommend error:', err);
    res.status(500).json({message: 'שגיאה בחיפוש', error: err.message});
  }
};

// Get tags that actually exist in recipes (for tag-based filtering)
exports.getAvailableTags = async (req, res) => {
  try {
    // Get all non-deleted recipes
    const recipes = await Recipe.find({isDeleted: false, visibility: 'Public'}).select('tags');

    // Collect all unique tag globalIds from recipes
    const usedTagIds = new Set();
    recipes.forEach(recipe => {
      if (recipe.tags && recipe.tags.length > 0) {
        recipe.tags.forEach(tagId => usedTagIds.add(Number(tagId)));
      }
    });

    if (usedTagIds.size === 0) {
      return res.json([]);
    }

    // Get all tag categories
    const tagCategories = await Tag.find();

    // Build result with only categories/tags that exist in recipes
    const availableTags = [];

    for (const category of tagCategories) {
      const availableInCategory = category.tags.filter(tag =>
        usedTagIds.has(tag.globalId)
      );

      if (availableInCategory.length > 0) {
        availableTags.push({
          category: category.category,
          categoryEn: category.categoryEn,
          tags: availableInCategory.map(t => ({
            globalId: t.globalId,
            name: t.he,
            nameEn: t.en,
          })),
        });
      }
    }

    res.json(availableTags);
  } catch (err) {
    console.error('Error getting available tags:', err);
    res.status(500).json({message: 'שגיאה בטעינת תגיות'});
  }
};

// Search recipes by selected tags
exports.searchByTags = async (req, res) => {
  try {
    const {tags} = req.body; // Array of globalIds

    if (!tags || tags.length === 0) {
      return res.status(400).json({message: 'יש לבחור לפחות תגית אחת'});
    }

    // Find recipes that have ALL selected tags
    const recipes = await Recipe.find({
      isDeleted: false,
      visibility: 'Public',
      tags: {$all: tags.map(t => String(t))},
    })
      .populate('author', 'name')
      .sort({createdAt: -1})
      .limit(20)
      .lean();

    // If no exact matches, find recipes with ANY of the tags
    let finalRecipes = recipes;
    let partialMatch = false;

    if (recipes.length === 0 && tags.length > 1) {
      finalRecipes = await Recipe.find({
        isDeleted: false,
        visibility: 'Public',
        tags: {$in: tags.map(t => String(t))},
      })
        .populate('author', 'name')
        .sort({createdAt: -1})
        .limit(20)
        .lean();
      partialMatch = true;
    }

    // Populate tags for display
    const recipesWithTags = await Promise.all(
      finalRecipes.map(r => populateTagsFromGlobalIds(r))
    );

    // Sort by number of matching tags (most matches first)
    recipesWithTags.sort((a, b) => {
      const aMatches = tags.filter(t => a.tags?.includes(String(t))).length;
      const bMatches = tags.filter(t => b.tags?.includes(String(t))).length;
      return bMatches - aMatches;
    });

    res.json({
      recipes: recipesWithTags,
      partialMatch,
      message: partialMatch
        ? 'לא נמצאו מתכונים עם כל התגיות, הנה מתכונים עם חלק מהתגיות:'
        : `נמצאו ${recipesWithTags.length} מתכונים מתאימים!`,
    });
  } catch (err) {
    console.error('Error searching by tags:', err);
    res.status(500).json({message: 'שגיאה בחיפוש'});
  }
};

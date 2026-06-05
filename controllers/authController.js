const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const {validationResult} = require('express-validator');
const User = require('../models/User');
const Recipe = require('../models/Recipe');
const {logActivity, extractIp} = require('../utils/logActivity');
const {computeBadges} = require('./analyticsController');

exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({errors: errors.array()});
  }

  const {name, email, password} = req.body;

  try {
    let user = await User.findOne({email});
    if (user) {
      return res.status(400).json({message: 'User already exists'});
    }

    user = new User({
      name,
      email,
      password,
      registrationIp: extractIp(req),
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    logActivity({req, user, action: 'register'});

    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      {expiresIn: '7d'},
      (err, token) => {
        if (err) throw err;
        res.json({token});
      },
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.login = async (req, res) => {
  const {email, password} = req.body;

  try {
    let user = await User.findOne({email});
    if (!user) {
      logActivity({req, action: 'login_failed', metadata: {email, reason: 'no_user'}});
      return res.status(400).json({message: 'Invalid credentials'});
    }

    // Check if user is suspended
    if (user.suspended) {
      logActivity({req, user, action: 'login_failed', metadata: {reason: 'suspended'}});
      return res
        .status(403)
        .json({message: 'החשבון שלך מושעה. אנא פנה למנהל המערכת.'});
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logActivity({req, user, action: 'login_failed', metadata: {reason: 'bad_password'}});
      return res.status(400).json({message: 'Invalid credentials'});
    }

    // Record successful login
    user.lastLogin = new Date();
    user.loginCount = (user.loginCount || 0) + 1;
    await user.save();
    logActivity({req, user, action: 'login', metadata: {method: 'password'}});

    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      {expiresIn: '7d'},
      (err, token) => {
        if (err) throw err;
        res.json({token});
      },
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Live stats + badges for the currently logged-in user (also persists badges)
exports.getMyStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const authorId = new mongoose.Types.ObjectId(String(userId));

    const [recipes, hearts, user] = await Promise.all([
      Recipe.countDocuments({author: userId, isDeleted: false}),
      // Count how many users have favorited any of this user's recipes
      User.aggregate([
        {$unwind: '$favorites'},
        {
          $lookup: {
            from: 'recipes',
            localField: 'favorites',
            foreignField: '_id',
            as: 'recipe',
          },
        },
        {$unwind: '$recipe'},
        {$match: {'recipe.author': authorId}},
        {$count: 'count'},
      ]),
      User.findById(userId).select('loginCount createdAt badges'),
    ]);

    const heartCount = hearts[0]?.count || 0;
    const stats = {
      recipes,
      hearts: heartCount,
      loginCount: user?.loginCount || 0,
    };
    const badges = computeBadges(stats);

    // Persist badges if they changed
    if (user && JSON.stringify(badges) !== JSON.stringify(user.badges || [])) {
      user.badges = badges;
      await user.save();
    }

    res.json({
      recipes,
      hearts: heartCount,
      loginCount: stats.loginCount,
      memberSince: user?.createdAt,
      badges,
    });
  } catch (err) {
    console.error('Error building user stats:', err.message);
    res.status(500).send('Server error');
  }
};

exports.googleAuthCallback = async (req, res) => {
  // Record successful Google login
  try {
    await User.findByIdAndUpdate(req.user.id, {
      lastLogin: new Date(),
      $inc: {loginCount: 1},
    });
    logActivity({req, user: req.user, action: 'login', metadata: {method: 'google'}});
  } catch (err) {
    console.error('Error recording google login:', err.message);
  }

  const payload = {
    user: {
      id: req.user.id,
    },
  };
  jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: '7d'}, (err, token) => {
    if (err) throw err;
    res.redirect(`${process.env.CLIENT_URL}/?token=${token}`);
  });
};

// Get user favorites
exports.getFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'favorites',
      populate: {
        path: 'author',
        select: 'name',
      },
    });
    res.json(user.favorites || []);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Add recipe to favorites
exports.addFavorite = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const recipeId = req.params.recipeId;

    // Check if already in favorites
    if (user.favorites.includes(recipeId)) {
      return res.status(400).json({message: 'המתכון כבר נמצא במועדפים'});
    }

    user.favorites.push(recipeId);
    await user.save();

    logActivity({req, user, action: 'favorite_add', targetType: 'recipe', targetId: recipeId});

    res.json({message: 'המתכון נוסף למועדפים', favorites: user.favorites});
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Remove recipe from favorites
exports.removeFavorite = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const recipeId = req.params.recipeId;

    user.favorites = user.favorites.filter(
      fav => fav.toString() !== recipeId
    );
    await user.save();

    logActivity({req, user, action: 'favorite_remove', targetType: 'recipe', targetId: recipeId});

    res.json({message: 'המתכון הוסר מהמועדפים', favorites: user.favorites});
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

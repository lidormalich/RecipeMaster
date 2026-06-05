const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');
const Recipe = require('../models/Recipe');

// Resolve a [from, to] date window from a `days` query param (default 30).
function resolveRange(req) {
  const days = Math.max(1, Math.min(parseInt(req.query.days) || 30, 365));
  const to = new Date();
  const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return {from, to, days};
}

// New user registrations per day within a range
async function registrationsByDay(from, to) {
  return User.aggregate([
    {$match: {createdAt: {$gte: from, $lte: to}}},
    {
      $group: {
        _id: {$dateToString: {format: '%Y-%m-%d', date: '$createdAt'}},
        count: {$sum: 1},
      },
    },
    {$sort: {_id: 1}},
    {$project: {_id: 0, date: '$_id', count: 1}},
  ]);
}

// Authors ranked by number of (non-deleted) recipes they've published
async function topAuthors(limit = 10) {
  return Recipe.aggregate([
    {$match: {isDeleted: false}},
    {$group: {_id: '$author', recipes: {$sum: 1}}},
    {$sort: {recipes: -1}},
    {$limit: limit},
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    {$unwind: {path: '$user', preserveNullAndEmptyArrays: true}},
    {
      $project: {
        _id: 0,
        userId: '$_id',
        name: '$user.name',
        recipes: 1,
      },
    },
  ]);
}

// Count, per action type, how many events occurred in the range
async function actionBreakdown(from, to) {
  return ActivityLog.aggregate([
    {$match: {createdAt: {$gte: from, $lte: to}}},
    {$group: {_id: '$action', count: {$sum: 1}}},
    {$sort: {count: -1}},
    {$project: {_id: 0, action: '$_id', count: 1}},
  ]);
}

// Authors ranked by total "hearts" (times their recipes were favorited)
async function mostLovedAuthors(limit = 5) {
  return User.aggregate([
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
    {$group: {_id: '$recipe.author', hearts: {$sum: 1}}},
    {$sort: {hearts: -1}},
    {$limit: limit},
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    {$unwind: {path: '$user', preserveNullAndEmptyArrays: true}},
    {$project: {_id: 0, userId: '$_id', name: '$user.name', hearts: 1}},
  ]);
}

// Most active users by number of logged events in the range
async function mostActiveUsers(from, to, limit = 5) {
  return ActivityLog.aggregate([
    {$match: {createdAt: {$gte: from, $lte: to}, user: {$ne: null}}},
    {$group: {_id: '$user', events: {$sum: 1}, name: {$last: '$userName'}}},
    {$sort: {events: -1}},
    {$limit: limit},
    {$project: {_id: 0, userId: '$_id', name: 1, events: 1}},
  ]);
}

// GET /api/analytics/overview — the main dashboard payload
exports.getOverview = async (req, res) => {
  try {
    const {from, to, days} = resolveRange(req);
    const now = Date.now();
    const dayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsers,
      dau,
      wau,
      mau,
      totalRecipes,
      totalViews,
      regByDay,
      loginsByDay,
      viewsByDay,
      topRecipes,
      authors,
      lovedAuthors,
      activeUsers,
      topSearches,
      byCountry,
      heatmap,
      breakdown,
      recentActivity,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({createdAt: {$gte: from}}),
      ActivityLog.activeUsersSince(dayAgo),
      ActivityLog.activeUsersSince(weekAgo),
      ActivityLog.activeUsersSince(monthAgo),
      Recipe.countDocuments({isDeleted: false}),
      ActivityLog.countDocuments({action: 'recipe_view', createdAt: {$gte: from}}),
      registrationsByDay(from, to),
      ActivityLog.getTimeSeries('login', from, to),
      ActivityLog.getTimeSeries('recipe_view', from, to),
      ActivityLog.getTopRecipes(from, to, 10),
      topAuthors(10),
      mostLovedAuthors(5),
      mostActiveUsers(from, to, 5),
      ActivityLog.getTopSearches(from, to, 10),
      ActivityLog.getByCountry(from, to, 15),
      ActivityLog.getActivityHeatmap(from, to),
      actionBreakdown(from, to),
      ActivityLog.getRecentActivity(25),
    ]);

    res.json({
      range: {from, to, days},
      kpis: {
        totalUsers,
        newUsers,
        dau,
        wau,
        mau,
        totalRecipes,
        totalViews,
      },
      registrationsByDay: regByDay,
      loginsByDay,
      viewsByDay,
      topRecipes,
      topAuthors: authors,
      topSearches,
      usersByCountry: byCountry,
      heatmap,
      actionBreakdown: breakdown,
      leaderboard: {
        mostRecipes: authors.slice(0, 5),
        mostLoved: lovedAuthors,
        mostActive: activeUsers,
      },
      recentActivity,
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error building analytics overview:', err);
    res.status(500).json({error: 'Failed to build analytics overview'});
  }
};

// GET /api/analytics/live — lightweight, frequently-polled live data
exports.getLive = async (req, res) => {
  try {
    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const [onlineUsers, trending] = await Promise.all([
      User.find({lastActiveAt: {$gte: fifteenMinAgo}})
        .select('name role lastActiveAt avatar')
        .sort({lastActiveAt: -1})
        .limit(50)
        .lean(),
      ActivityLog.aggregate([
        {
          $match: {
            action: 'recipe_view',
            createdAt: {$gte: hourAgo},
            targetId: {$ne: null},
          },
        },
        {
          $group: {
            _id: '$targetId',
            views: {$sum: 1},
            title: {$last: '$metadata.recipeTitle'},
          },
        },
        {$sort: {views: -1}},
        {$limit: 5},
        {$project: {_id: 0, shortId: '$_id', views: 1, title: 1}},
      ]),
    ]);

    res.json({
      onlineCount: onlineUsers.length,
      onlineUsers,
      trending,
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error building live data:', err);
    res.status(500).json({error: 'Failed to build live data'});
  }
};

// --- Gamification: badge definitions -------------------------------------

const BADGE_RULES = [
  {id: '🥇 שף מנוסה', test: s => s.recipes >= 10},
  {id: '👨‍🍳 יוצר תוכן', test: s => s.recipes >= 1},
  {id: '❤️ אהוב הקהל', test: s => s.hearts >= 100},
  {id: '💛 מתחבב', test: s => s.hearts >= 10},
  {id: '🔥 משתמש כבד', test: s => s.loginCount >= 50},
  {id: '⭐ ותיק', test: s => s.loginCount >= 10},
];

function computeBadges(stats) {
  return BADGE_RULES.filter(b => b.test(stats)).map(b => b.id);
}

// POST /api/analytics/recompute-badges — recalculate and persist user badges
exports.recomputeBadges = async (req, res) => {
  try {
    // recipes per author
    const recipeCounts = await Recipe.aggregate([
      {$match: {isDeleted: false}},
      {$group: {_id: '$author', recipes: {$sum: 1}}},
    ]);
    // hearts per author (favorites pointing at their recipes)
    const heartCounts = await mostLovedAuthors(10000);

    const recipeMap = new Map(recipeCounts.map(r => [String(r._id), r.recipes]));
    const heartMap = new Map(heartCounts.map(h => [String(h.userId), h.hearts]));

    const users = await User.find().select('loginCount badges');
    let updated = 0;

    for (const u of users) {
      const stats = {
        recipes: recipeMap.get(String(u._id)) || 0,
        hearts: heartMap.get(String(u._id)) || 0,
        loginCount: u.loginCount || 0,
      };
      const badges = computeBadges(stats);
      // Only write when changed
      if (JSON.stringify(badges) !== JSON.stringify(u.badges || [])) {
        u.badges = badges;
        await u.save();
        updated++;
      }
    }

    res.json({message: 'Badges recomputed', usersUpdated: updated});
  } catch (err) {
    console.error('Error recomputing badges:', err);
    res.status(500).json({error: 'Failed to recompute badges'});
  }
};

module.exports.computeBadges = computeBadges;

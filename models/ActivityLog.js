const mongoose = require('mongoose');

// A single record per meaningful action performed on the site.
// Designed as fire-and-forget: writes must never block or break a user request.
const activityLogSchema = new mongoose.Schema({
  // Who performed the action (null = guest / unauthenticated)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  // Snapshot of the name so the feed stays readable even after a user is deleted
  userName: {
    type: String,
  },
  action: {
    type: String,
    required: true,
    enum: [
      'login',
      'logout',
      'register',
      'login_failed',
      'recipe_view',
      'recipe_create',
      'recipe_update',
      'recipe_delete',
      'favorite_add',
      'favorite_remove',
      'cart_add',
      'search',
      'ai_use',
      'share',
    ],
    index: true,
  },
  // What the action targeted, when relevant
  targetType: {
    type: String, // 'recipe' | 'user' | 'tag'
  },
  targetId: {
    type: String, // shortId / ObjectId of the target
  },
  // Free-form extra context (search query, recipe title, etc.)
  metadata: {
    type: mongoose.Schema.Types.Mixed,
  },
  // Stored truncated (last octet dropped) for privacy
  ip: {
    type: String,
  },
  // Derived from the full IP via geoip before truncation
  country: {
    type: String,
  },
  userAgent: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for efficient analytics queries
activityLogSchema.index({createdAt: -1});
activityLogSchema.index({action: 1, createdAt: -1});
activityLogSchema.index({user: 1, createdAt: -1});

// Optional: auto-expire logs after 180 days to keep the collection lean.
// Comment out if you want to retain history indefinitely.
activityLogSchema.index({createdAt: 1}, {expireAfterSeconds: 60 * 60 * 24 * 180});

// --- Helpers ---------------------------------------------------------------

// Count distinct active users since a given date (for DAU/WAU/MAU)
activityLogSchema.statics.activeUsersSince = async function (since) {
  const result = await this.aggregate([
    {$match: {createdAt: {$gte: since}, user: {$ne: null}}},
    {$group: {_id: '$user'}},
    {$count: 'count'},
  ]);
  return result[0]?.count || 0;
};

// Daily time-series count for a given action within a range
activityLogSchema.statics.getTimeSeries = async function (action, from, to) {
  const match = {createdAt: {$gte: from, $lte: to}};
  if (action) match.action = action;

  return this.aggregate([
    {$match: match},
    {
      $group: {
        _id: {
          $dateToString: {format: '%Y-%m-%d', date: '$createdAt'},
        },
        count: {$sum: 1},
      },
    },
    {$sort: {_id: 1}},
    {$project: {_id: 0, date: '$_id', count: 1}},
  ]);
};

// Top viewed recipes within a range
activityLogSchema.statics.getTopRecipes = async function (from, to, limit = 10) {
  return this.aggregate([
    {
      $match: {
        action: 'recipe_view',
        createdAt: {$gte: from, $lte: to},
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
    {$limit: limit},
    {$project: {_id: 0, shortId: '$_id', views: 1, title: 1}},
  ]);
};

// Most popular free-text searches within a range
activityLogSchema.statics.getTopSearches = async function (from, to, limit = 10) {
  return this.aggregate([
    {
      $match: {
        action: 'search',
        createdAt: {$gte: from, $lte: to},
        'metadata.query': {$nin: [null, '']},
      },
    },
    {
      $group: {
        _id: {$toLower: '$metadata.query'},
        count: {$sum: 1},
      },
    },
    {$sort: {count: -1}},
    {$limit: limit},
    {$project: {_id: 0, query: '$_id', count: 1}},
  ]);
};

// Activity counts by hour-of-week (0=Sunday) for a heatmap
activityLogSchema.statics.getActivityHeatmap = async function (from, to) {
  return this.aggregate([
    {$match: {createdAt: {$gte: from, $lte: to}}},
    {
      $group: {
        _id: {
          dayOfWeek: {$dayOfWeek: '$createdAt'}, // 1=Sunday..7=Saturday
          hour: {$hour: '$createdAt'},
        },
        count: {$sum: 1},
      },
    },
    {
      $project: {
        _id: 0,
        day: {$subtract: ['$_id.dayOfWeek', 1]}, // normalize to 0..6
        hour: '$_id.hour',
        count: 1,
      },
    },
  ]);
};

// Distribution of users/activity by country
activityLogSchema.statics.getByCountry = async function (from, to, limit = 15) {
  return this.aggregate([
    {
      $match: {
        createdAt: {$gte: from, $lte: to},
        country: {$nin: [null, '']},
      },
    },
    {$group: {_id: '$country', count: {$sum: 1}}},
    {$sort: {count: -1}},
    {$limit: limit},
    {$project: {_id: 0, country: '$_id', count: 1}},
  ]);
};

// Recent activity feed
activityLogSchema.statics.getRecentActivity = async function (limit = 25) {
  return this.find()
    .sort({createdAt: -1})
    .limit(limit)
    .select('userName action targetType targetId metadata country createdAt')
    .lean();
};

module.exports = mongoose.model('ActivityLog', activityLogSchema);

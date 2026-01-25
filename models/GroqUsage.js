const mongoose = require('mongoose');

const groqUsageSchema = new mongoose.Schema({
  // Request details
  model: {
    type: String,
    required: true,
  },
  promptTokens: {
    type: Number,
    default: 0,
  },
  completionTokens: {
    type: Number,
    default: 0,
  },
  totalTokens: {
    type: Number,
    default: 0,
  },
  responseTime: {
    type: Number, // in milliseconds
    default: 0,
  },

  // Request metadata
  endpoint: {
    type: String, // e.g., 'ai-recommend', 'generate-tags'
  },
  success: {
    type: Boolean,
    default: true,
  },
  errorMessage: {
    type: String,
  },

  // Timestamp
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for efficient queries
groqUsageSchema.index({createdAt: -1});
groqUsageSchema.index({model: 1, createdAt: -1});

// Static method to get monthly stats
groqUsageSchema.statics.getMonthlyStats = async function (year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  const stats = await this.aggregate([
    {
      $match: {
        createdAt: {$gte: startDate, $lt: endDate},
      },
    },
    {
      $group: {
        _id: null,
        totalRequests: {$sum: 1},
        successfulRequests: {
          $sum: {$cond: ['$success', 1, 0]},
        },
        totalPromptTokens: {$sum: '$promptTokens'},
        totalCompletionTokens: {$sum: '$completionTokens'},
        totalTokens: {$sum: '$totalTokens'},
        avgResponseTime: {$avg: '$responseTime'},
      },
    },
  ]);

  return stats[0] || {
    totalRequests: 0,
    successfulRequests: 0,
    totalPromptTokens: 0,
    totalCompletionTokens: 0,
    totalTokens: 0,
    avgResponseTime: 0,
  };
};

// Static method to get stats by model
groqUsageSchema.statics.getStatsByModel = async function (year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  return this.aggregate([
    {
      $match: {
        createdAt: {$gte: startDate, $lt: endDate},
      },
    },
    {
      $group: {
        _id: '$model',
        requests: {$sum: 1},
        totalTokens: {$sum: '$totalTokens'},
        promptTokens: {$sum: '$promptTokens'},
        completionTokens: {$sum: '$completionTokens'},
        avgResponseTime: {$avg: '$responseTime'},
      },
    },
    {
      $project: {
        model: '$_id',
        requests: 1,
        totalTokens: 1,
        promptTokens: 1,
        completionTokens: 1,
        avgResponseTime: {$round: ['$avgResponseTime', 0]},
      },
    },
    {
      $sort: {requests: -1},
    },
  ]);
};

// Static method to get daily breakdown
groqUsageSchema.statics.getDailyBreakdown = async function (year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  return this.aggregate([
    {
      $match: {
        createdAt: {$gte: startDate, $lt: endDate},
      },
    },
    {
      $group: {
        _id: {$dayOfMonth: '$createdAt'},
        requests: {$sum: 1},
        tokens: {$sum: '$totalTokens'},
      },
    },
    {
      $sort: {_id: 1},
    },
    {
      $project: {
        day: '$_id',
        requests: 1,
        tokens: 1,
      },
    },
  ]);
};

// Static method to get stats by endpoint
groqUsageSchema.statics.getStatsByEndpoint = async function (year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  return this.aggregate([
    {
      $match: {
        createdAt: {$gte: startDate, $lt: endDate},
      },
    },
    {
      $group: {
        _id: '$endpoint',
        requests: {$sum: 1},
        totalTokens: {$sum: '$totalTokens'},
        avgResponseTime: {$avg: '$responseTime'},
      },
    },
    {
      $project: {
        endpoint: '$_id',
        requests: 1,
        totalTokens: 1,
        avgResponseTime: {$round: ['$avgResponseTime', 0]},
      },
    },
    {
      $sort: {requests: -1},
    },
  ]);
};

module.exports = mongoose.model('GroqUsage', groqUsageSchema);

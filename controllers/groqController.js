const Groq = require('groq-sdk');
const GroqUsage = require('../models/GroqUsage');

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Free tier limits for Groq
const LIMITS = {
  requestLimit: 14400, // 14,400 requests per day
  tokenLimit: 500000, // ~500K tokens per day estimate
  rpmLimit: 30, // 30 requests per minute
  tpmLimit: 15000, // 15K tokens per minute
};

// Track usage - save to database
async function trackUsage(model, usage, responseTime, endpoint, success = true, errorMessage = null) {
  try {
    const record = await GroqUsage.create({
      model,
      promptTokens: usage?.prompt_tokens || 0,
      completionTokens: usage?.completion_tokens || 0,
      totalTokens: usage?.total_tokens || 0,
      responseTime,
      endpoint,
      success,
      errorMessage,
    });
    console.log(`[Groq Tracking] Saved: ${endpoint} - ${usage?.total_tokens || 0} tokens - ${responseTime}ms`);
  } catch (err) {
    console.error('Error tracking Groq usage:', err);
  }
}

// Wrapper function for Groq API calls with tracking
async function groqWithTracking(messages, model = 'llama-3.3-70b-versatile', options = {}, endpoint = 'unknown') {
  const startTime = Date.now();

  try {
    const response = await groq.chat.completions.create({
      messages,
      model,
      ...options,
    });

    const responseTime = Date.now() - startTime;
    await trackUsage(model, response.usage, responseTime, endpoint, true);

    return response;
  } catch (error) {
    const responseTime = Date.now() - startTime;
    await trackUsage(model, null, responseTime, endpoint, false, error.message);
    console.error('Groq API Error:', error);
    throw error;
  }
}

// Get usage statistics endpoint
exports.getUsage = async (req, res) => {
  try {
    const {year, month} = req.query;
    const now = new Date();
    const targetYear = parseInt(year) || now.getFullYear();
    const targetMonth = parseInt(month) || now.getMonth() + 1;

    // Get monthly stats
    const monthlyStats = await GroqUsage.getMonthlyStats(targetYear, targetMonth);

    // Get stats by model
    const modelStats = await GroqUsage.getStatsByModel(targetYear, targetMonth);

    // Get stats by endpoint
    const endpointStats = await GroqUsage.getStatsByEndpoint(targetYear, targetMonth);

    // Get daily breakdown
    const dailyBreakdown = await GroqUsage.getDailyBreakdown(targetYear, targetMonth);

    // Get today's stats for rate limiting display
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayStats = await GroqUsage.aggregate([
      {$match: {createdAt: {$gte: todayStart}}},
      {
        $group: {
          _id: null,
          requests: {$sum: 1},
          tokens: {$sum: '$totalTokens'},
        },
      },
    ]);

    // Get last minute stats for RPM/TPM
    const oneMinuteAgo = new Date(Date.now() - 60000);
    const minuteStats = await GroqUsage.aggregate([
      {$match: {createdAt: {$gte: oneMinuteAgo}}},
      {
        $group: {
          _id: null,
          requests: {$sum: 1},
          tokens: {$sum: '$totalTokens'},
        },
      },
    ]);

    const responseData = {
      // Current period info
      year: targetYear,
      month: targetMonth,
      monthName: new Date(targetYear, targetMonth - 1).toLocaleString('he-IL', {month: 'long'}),

      // Monthly totals
      monthly: {
        totalRequests: monthlyStats.totalRequests,
        successfulRequests: monthlyStats.successfulRequests,
        failedRequests: monthlyStats.totalRequests - monthlyStats.successfulRequests,
        totalTokens: monthlyStats.totalTokens,
        promptTokens: monthlyStats.totalPromptTokens,
        completionTokens: monthlyStats.totalCompletionTokens,
        avgResponseTime: Math.round(monthlyStats.avgResponseTime || 0),
      },

      // Today's usage (for limits comparison)
      today: {
        requests: todayStats[0]?.requests || 0,
        tokens: todayStats[0]?.tokens || 0,
      },

      // Current rate (last minute)
      currentRate: {
        requestsPerMinute: minuteStats[0]?.requests || 0,
        tokensPerMinute: minuteStats[0]?.tokens || 0,
      },

      // Limits
      limits: LIMITS,

      // Breakdowns
      byModel: modelStats,
      byEndpoint: endpointStats,
      byDay: dailyBreakdown,

      lastUpdated: new Date().toISOString(),
    };

    res.json(responseData);
  } catch (error) {
    console.error('Error fetching usage:', error);
    res.status(500).json({error: 'Failed to fetch usage data'});
  }
};

// Get available months for history
exports.getAvailableMonths = async (req, res) => {
  try {
    const months = await GroqUsage.aggregate([
      {
        $group: {
          _id: {
            year: {$year: '$createdAt'},
            month: {$month: '$createdAt'},
          },
          count: {$sum: 1},
        },
      },
      {$sort: {'_id.year': -1, '_id.month': -1}},
    ]);

    res.json(
      months.map(m => ({
        year: m._id.year,
        month: m._id.month,
        requests: m.count,
      })),
    );
  } catch (error) {
    console.error('Error fetching available months:', error);
    res.status(500).json({error: 'Failed to fetch available months'});
  }
};

// Export helpers for use in other controllers
module.exports.groqWithTracking = groqWithTracking;
module.exports.trackUsage = trackUsage;

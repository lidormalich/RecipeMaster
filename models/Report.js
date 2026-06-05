const mongoose = require('mongoose');

// A user-submitted report flagging content (currently recipes) for admin review.
const reportSchema = new mongoose.Schema({
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  reporterName: {
    type: String,
  },
  targetType: {
    type: String,
    default: 'recipe',
  },
  targetId: {
    type: String, // recipe shortId
    required: true,
  },
  recipeTitle: {
    type: String,
  },
  reason: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['open', 'resolved', 'dismissed'],
    default: 'open',
    index: true,
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  resolvedByName: {
    type: String,
  },
  resolvedAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

module.exports = mongoose.model('Report', reportSchema);

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
    },
    googleId: {
      type: String,
    },
    avatar: {
      type: String,
    },
    role: {
      type: String,
      enum: ['Admin', 'PosterAdmin', 'Poster', 'User'],
      default: 'User',
    },
    permissions: [
      {
        type: String,
      },
    ],
    suspended: {
      type: Boolean,
      default: false,
    },
    // --- Activity tracking ---
    lastLogin: {
      type: Date,
    },
    loginCount: {
      type: Number,
      default: 0,
    },
    lastActiveAt: {
      type: Date,
    },
    registrationIp: {
      type: String,
    },
    // Gamification — earned achievement badges (see analyticsController)
    badges: [
      {
        type: String,
      },
    ],
    favorites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Recipe',
      },
    ],
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('User', userSchema);

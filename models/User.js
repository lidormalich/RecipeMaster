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
      enum: ['Admin', 'Poster', 'User'],
      default: 'User',
    },
    permissions: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('User', userSchema);

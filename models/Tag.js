const mongoose = require('mongoose');

const TagSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      trim: true,
    },
    categoryEn: {
      type: String,
      trim: true,
    },
    tags: [
      {
        he: {
          type: String,
          required: true,
          trim: true,
        },
        en: {
          type: String,
          trim: true,
        },
        globalId: {
          type: Number,
          required: true,
          unique: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
TagSchema.index({category: 1});
TagSchema.index({'tags.globalId': 1});

module.exports = mongoose.model('Tag', TagSchema);

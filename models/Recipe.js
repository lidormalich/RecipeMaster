const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema(
  {
    shortId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    ingredients: {
      type: String,
      required: true,
    },
    instructions: {
      type: String,
      required: true,
    },
    mainImage: {
      type: String,
    },
    additionalImages: [
      {
        type: String,
      },
    ],
    videoUrl: {
      type: String,
    },
    tags: [
      {
        type: Number, // globalId של התגית (מספר ייחודי)
      },
    ],
    // שמירה על התאימות הלאחור - תגיות ישנות
    legacyTags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tag',
      },
    ],
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    visibility: {
      type: String,
      enum: ['Private', 'Shared', 'Public'],
      default: 'Public',
    },
    prepTime: {
      type: Number, // בדקות
    },
    servings: {
      type: Number,
    },
    difficulty: {
      type: String,
      enum: ['קל', 'בינוני', 'מתקדם', ''],
    },
    dishType: {
      type: String,
      enum: ['ראשונה', 'עיקרית', 'קינוח', 'חטיף', ''],
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    ratings: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        score: {
          type: Number,
          min: 1,
          max: 5,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('Recipe', recipeSchema);

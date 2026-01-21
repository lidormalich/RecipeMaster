const mongoose = require('mongoose');
const Tag = require('../models/Tag');
const tagData = require('./tagData');

// Auto-seed tags on first run
async function autoSeedTags() {
  try {
    // Check if tags already exist
    const existingTags = await Tag.countDocuments();

    if (existingTags > 0) {
      console.log(`✅ Tags already seeded (${existingTags} categories found)`);
      return;
    }

    console.log('🌱 No tags found. Starting auto-seed...');

    // Insert tags
    const result = await Tag.insertMany(tagData);
    const totalTags = result.reduce((sum, cat) => sum + cat.tags.length, 0);

    console.log(`✅ Successfully seeded ${result.length} categories with ${totalTags} tags`);
  } catch (error) {
    console.error('❌ Error auto-seeding tags:', error.message);
  }
}

module.exports = autoSeedTags;

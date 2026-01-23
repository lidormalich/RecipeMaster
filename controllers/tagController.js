const Tag = require('../models/Tag');

// Get all tags grouped by categories
exports.getTags = async (req, res) => {
  try {
    const tags = await Tag.find().sort({category: 1});
    res.json(tags);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Quick create tag - used when user types comma in tag input (Admin/Poster only)
exports.quickCreateTag = async (req, res) => {
  const {tagName, category = 'כללי'} = req.body;

  try {
    if (!tagName || tagName.trim() === '') {
      return res.status(400).json({message: 'Tag name is required'});
    }

    // Check if tag already exists by name
    const existingCategory = await Tag.findOne({
      'tags.he': tagName.trim(),
    });

    if (existingCategory) {
      // Return the existing tag
      const existingTag = existingCategory.tags.find(
        t => t.he === tagName.trim(),
      );
      return res.json({
        tag: existingTag,
        category: existingCategory.category,
        isNew: false,
      });
    }

    // Generate globalId for new tag
    const globalId = await generateGlobalId();

    // Find or create category
    let tagCategory = await Tag.findOne({category});

    if (!tagCategory) {
      // Create new category
      tagCategory = new Tag({
        category,
        categoryEn: transliterateCategory(category),
        tags: [],
      });
    }

    // Add new tag to category
    const newTag = {
      he: tagName.trim(),
      en: transliterate(tagName),
      globalId,
    };

    tagCategory.tags.push(newTag);
    await tagCategory.save();

    res.json({
      tag: newTag,
      category: tagCategory.category,
      isNew: true,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({message: 'Server error', error: err.message});
  }
};

// Create a new category with tags
exports.createTag = async (req, res) => {
  const {category, categoryEn, tags} = req.body;

  try {
    // Check if category exists
    let tagCategory = await Tag.findOne({category});

    if (tagCategory) {
      return res.status(400).json({message: 'Category already exists'});
    }

    tagCategory = new Tag({
      category,
      categoryEn: categoryEn || transliterateCategory(category),
      tags: tags || [],
    });

    await tagCategory.save();
    res.json(tagCategory);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Update tag - can edit Hebrew/English name
exports.updateTag = async (req, res) => {
  try {
    const {categoryId, tagId, he, en} = req.body;

    const tagCategory = await Tag.findById(categoryId);
    if (!tagCategory) {
      return res.status(404).json({message: 'Category not found'});
    }

    const tag = tagCategory.tags.id(tagId);
    if (!tag) {
      return res.status(404).json({message: 'Tag not found'});
    }

    if (he) tag.he = he;
    if (en) tag.en = en;

    await tagCategory.save();
    res.json(tagCategory);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Delete tag
exports.deleteTag = async (req, res) => {
  try {
    const {categoryId, tagId} = req.body;

    const tagCategory = await Tag.findById(categoryId);
    if (!tagCategory) {
      return res.status(404).json({message: 'Category not found'});
    }

    tagCategory.tags = tagCategory.tags.filter(
      t => t._id.toString() !== tagId
    );

    await tagCategory.save();
    res.json({message: 'Tag deleted', category: tagCategory});
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Search tags by query
exports.searchTags = async (req, res) => {
  try {
    const {q} = req.query;

    if (!q) {
      return res.json([]);
    }

    const categories = await Tag.find({
      $or: [
        {'tags.he': {$regex: q, $options: 'i'}},
        {'tags.en': {$regex: q, $options: 'i'}},
        {category: {$regex: q, $options: 'i'}},
      ],
    });

    // Flatten results
    const results = [];
    categories.forEach(cat => {
      cat.tags.forEach(tag => {
        if (
          tag.he.toLowerCase().includes(q.toLowerCase()) ||
          (tag.en && tag.en.toLowerCase().includes(q.toLowerCase()))
        ) {
          results.push({
            ...tag.toObject(),
            category: cat.category,
          });
        }
      });
    });

    res.json(results);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Get tag recommendations based on selected tags
exports.recommendTags = async (req, res) => {
  try {
    const {selectedTags} = req.query; // comma-separated globalIds

    if (!selectedTags) {
      return res.json([]);
    }

    // Convert to numbers for consistent comparison
    const selectedTagsArray = selectedTags.split(',').map(id => Number(id));

    // Find categories of selected tags
    const categories = await Tag.find({
      'tags.globalId': {$in: selectedTagsArray},
    });

    // Get all tags from these categories that are not already selected
    const recommendations = [];
    categories.forEach(cat => {
      cat.tags.forEach(tag => {
        if (!selectedTagsArray.includes(Number(tag.globalId))) {
          recommendations.push({
            ...tag.toObject(),
            category: cat.category,
          });
        }
      });
    });

    // Limit to 5 recommendations
    res.json(recommendations.slice(0, 5));
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Helper functions

async function generateGlobalId() {
  // Generate a unique numeric ID
  const allTags = await Tag.find();
  let maxId = 99000; // Start custom tags from 99001
  allTags.forEach(cat => {
    cat.tags.forEach(tag => {
      if (tag.globalId > maxId) {
        maxId = tag.globalId;
      }
    });
  });
  return maxId + 1;
}

function transliterate(hebrewText) {
  // Simple transliteration - can be enhanced
  const mapping = {
    א: 'a',
    ב: 'b',
    ג: 'g',
    ד: 'd',
    ה: 'h',
    ו: 'v',
    ז: 'z',
    ח: 'ch',
    ט: 't',
    י: 'y',
    כ: 'k',
    ך: 'k',
    ל: 'l',
    מ: 'm',
    ם: 'm',
    נ: 'n',
    ן: 'n',
    ס: 's',
    ע: 'a',
    פ: 'p',
    ף: 'f',
    צ: 'tz',
    ץ: 'tz',
    ק: 'k',
    ר: 'r',
    ש: 'sh',
    ת: 't',
  };

  return hebrewText
    .split('')
    .map(char => mapping[char] || char)
    .join('');
}

function transliterateCategory(category) {
  const translations = {
    'זמן הכנה': 'Preparation Time',
    'רמת קושי': 'Difficulty',
    'סוג מנה': 'Dish Type',
    תזונה: 'Nutrition',
    כשרות: 'Kosher',
    'סגנון מטבח': 'Cuisine Style',
    'חומרי גלם': 'Ingredients',
    'שיטת בישול': 'Cooking Method',
    'עונות שנה': 'Seasons',
    חגים: 'Holidays',
    אירועים: 'Events',
    'ארוחות ביום': 'Daily Meals',
    מרקמים: 'Textures',
    טעמים: 'Flavors',
    תקציב: 'Budget',
    'כלי בישול': 'Cooking Tools',
    בריאות: 'Health',
    לילדים: 'For Kids',
    'מקור המתכון': 'Recipe Source',
    'תוספות ליד': 'Side Dishes',
    כללי: 'General',
  };

  return translations[category] || category;
}

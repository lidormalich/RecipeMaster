const Tag = require('../models/Tag');
const Groq = require('groq-sdk');

// ========== CACHE SYSTEM ==========
let tagsCache = {
  data: null,
  systemPrompt: null,
  compactList: null,
  lastUpdated: null,
  TTL: 5 * 60 * 1000, // 5 minutes cache
};

// Load and cache tags
async function getCachedTags() {
  const now = Date.now();

  // Check if cache is still valid
  if (
    tagsCache.data &&
    tagsCache.lastUpdated &&
    now - tagsCache.lastUpdated < tagsCache.TTL
  ) {
    return tagsCache;
  }

  // Reload from database
  const allTagCategories = await Tag.find();

  // Build compact list for prompt (minimal tokens)
  // Format: "category:id1=name1,id2=name2|category2:id3=name3"
  const compactList = allTagCategories
    .map(cat => {
      const tags = cat.tags.map(t => `${t.globalId}=${t.he}`).join(',');
      return `${cat.category}:${tags}`;
    })
    .join('|');

  // Build system prompt (cached, doesn't count against user prompt tokens)
  const systemPrompt = `אתה מערכת סיווג מתכונים. תפקידך לבחור תגיות מרשימה קיימת.

פורמט התגיות: category:id=name,id=name|category2:id=name
${compactList}

כללים:
- החזר רק IDs מהרשימה
- בחר 5-10 תגיות מקטגוריות שונות
- לזמן הכנה - בחר טווח קיים, לא ליצור חדש
- אם צריך תגית חדשה: id=0
- פורמט תשובה: JSON בלבד`;

  // Update cache
  tagsCache = {
    data: allTagCategories,
    systemPrompt,
    compactList,
    lastUpdated: now,
    TTL: 5 * 60 * 1000,
  };

  return tagsCache;
}

// Invalidate cache when tags change
function invalidateTagsCache() {
  tagsCache.lastUpdated = null;
}

// Simple hash for caching similar recipes
function hashRecipeContent(title, ingredients) {
  const content = `${title}:${ingredients}`.toLowerCase().replace(/\s+/g, '');
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

// Results cache for similar recipes
const resultsCache = new Map();
const RESULTS_CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const MAX_CACHE_SIZE = 100;

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

    tagCategory.tags = tagCategory.tags.filter(t => t._id.toString() !== tagId);

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

// AI Auto-generate tags based on recipe content
exports.generateTagsAI = async (req, res) => {
  try {
    const {title, description, ingredients, instructions} = req.body;

    console.log('=== AI Tag Generation Started ===');
    console.log('Input:', {
      title,
      description: description?.substring(0, 50),
      ingredients: ingredients?.substring(0, 50),
    });

    if (!title || !ingredients) {
      return res
        .status(400)
        .json({message: 'Title and ingredients are required'});
    }

    // Get all existing tags from database
    let allTagCategories = await Tag.find();
    console.log('Total tag categories found:', allTagCategories.length);

    // Build structured JSON of all existing tags for precise matching
    const existingTagsJSON = allTagCategories.map(cat => ({
      category: cat.category,
      tags: cat.tags.map(t => ({id: t.globalId, name: t.he})),
    }));

    // Initialize Groq client
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const prompt = `אתה מומחה לסיווג מתכונים. עליך לבחור תגיות מתוך רשימה קיימת בלבד.

פרטי המתכון:
כותרת: ${title}
תיאור: ${description || 'לא צוין'}
רכיבים: ${ingredients}
הוראות הכנה: ${instructions || 'לא צוין'}

הנה כל התגיות הקיימות במערכת בפורמט JSON:
${JSON.stringify(existingTagsJSON, null, 2)}

הנחיות חשובות מאוד:
1. בחר 5-10 תגיות מתאימות מקטגוריות שונות
2. חובה להחזיר את ה-ID המדויק (globalId) של התגית מהרשימה למעלה
3. אם תגית לא קיימת ברשימה - החזר id: null ואני אצור אותה
4. לגבי זמן הכנה - בחר את הטווח המתאים מהקיימים (לא ליצור טווחים חדשים כמו "40 דק'" אם יש "30-45 דקות")
5. לגבי רמת קושי - השתמש רק בערכים הקיימים
6. אל תיצור תגיות כפולות עם שמות דומים לקיימות

החזר את התשובה בפורמט JSON הבא בלבד:
{"tags": [{"id": 1003, "name": "30-45 דקות", "category": "זמן הכנה"}, {"id": null, "name": "תגית חדשה", "category": "קטגוריה"}]}

דוגמה נכונה (עם IDs מהרשימה):
{"tags": [{"id": 1003, "name": "30-45 דקות", "category": "זמן הכנה"}, {"id": 2002, "name": "קל", "category": "רמת קושי"}]}`;

    console.log('Sending request to Groq...');

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 800,
    });

    const responseText = completion.choices[0]?.message?.content || '';
    console.log('Groq raw response:', responseText);

    // Parse the JSON response
    let suggestedTags = [];
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        console.log('Extracted JSON:', jsonMatch[0]);
        const parsed = JSON.parse(jsonMatch[0]);

        if (Array.isArray(parsed.tags)) {
          suggestedTags = parsed.tags;
        }
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
    }

    console.log('Suggested tags from AI:', suggestedTags);

    // Process each suggested tag - match existing or create new
    const finalTags = [];
    const createdTags = [];
    const processedNames = new Set(); // Prevent duplicates

    for (const suggestion of suggestedTags) {
      const tagId = suggestion.id;
      const tagName = suggestion.name?.trim();
      const categoryName = suggestion.category?.trim();

      if (!tagName || !categoryName) {
        console.log('Skipping invalid suggestion:', suggestion);
        continue;
      }

      // Normalize tag name for duplicate detection
      const normalizedName = normalizeTagName(tagName);
      if (processedNames.has(normalizedName)) {
        console.log(`Skipping duplicate: "${tagName}"`);
        continue;
      }

      // If AI provided an ID, verify it exists
      if (tagId !== null && tagId !== undefined) {
        let foundTag = null;
        let foundCategory = null;

        for (const category of allTagCategories) {
          const tag = category.tags.find(t => t.globalId === tagId);
          if (tag) {
            foundTag = tag;
            foundCategory = category;
            break;
          }
        }

        if (foundTag) {
          console.log(
            `Using AI-provided ID: "${tagName}" -> globalId: ${tagId}`,
          );
          finalTags.push({
            globalId: foundTag.globalId,
            he: foundTag.he,
            en: foundTag.en,
            category: foundCategory.category,
            isNew: false,
          });
          processedNames.add(normalizedName);
          continue;
        } else {
          console.log(`AI-provided ID ${tagId} not found, will search by name`);
        }
      }

      // Try to find existing tag by name (fuzzy match)
      let found = false;
      for (const category of allTagCategories) {
        const foundTag = category.tags.find(t => {
          const existingNormalized = normalizeTagName(t.he);
          return (
            existingNormalized === normalizedName ||
            isSimilarTag(t.he, tagName, categoryName)
          );
        });

        if (foundTag) {
          console.log(
            `Matched existing by name: "${tagName}" -> "${foundTag.he}" (globalId: ${foundTag.globalId})`,
          );
          finalTags.push({
            globalId: foundTag.globalId,
            he: foundTag.he,
            en: foundTag.en,
            category: category.category,
            isNew: false,
          });
          processedNames.add(normalizedName);
          found = true;
          break;
        }
      }

      // If not found, create new tag (only if it's genuinely new)
      if (!found) {
        // Check if we should create this tag or if it's too similar to existing
        const similarExisting = findSimilarExistingTag(
          allTagCategories,
          tagName,
          categoryName,
        );

        if (similarExisting) {
          console.log(
            `Found similar existing tag: "${tagName}" -> using "${similarExisting.he}"`,
          );
          finalTags.push({
            globalId: similarExisting.globalId,
            he: similarExisting.he,
            en: similarExisting.en,
            category: similarExisting.category,
            isNew: false,
          });
          processedNames.add(normalizedName);
        } else {
          console.log(
            `Creating new tag: "${tagName}" in category "${categoryName}"`,
          );

          // Find or create category
          let tagCategory = await Tag.findOne({category: categoryName});

          if (!tagCategory) {
            tagCategory = new Tag({
              category: categoryName,
              categoryEn: transliterateCategory(categoryName),
              tags: [],
            });
            console.log(`Created new category: "${categoryName}"`);
          }

          const globalId = await generateGlobalId();

          const newTag = {
            he: tagName,
            en: transliterate(tagName),
            globalId,
          };

          tagCategory.tags.push(newTag);
          await tagCategory.save();

          finalTags.push({
            globalId: newTag.globalId,
            he: newTag.he,
            en: newTag.en,
            category: categoryName,
            isNew: true,
          });

          createdTags.push({name: tagName, category: categoryName});
          processedNames.add(normalizedName);
          console.log(`Created tag: "${tagName}" with globalId: ${globalId}`);

          allTagCategories = await Tag.find();
        }
      }
    }

    // Remove duplicates
    const uniqueTags = finalTags.filter(
      (tag, index, self) =>
        index === self.findIndex(t => t.globalId === tag.globalId),
    );

    console.log('Final unique tags:', uniqueTags.length);
    console.log('New tags created:', createdTags.length);
    console.log('=== AI Tag Generation Complete ===');

    res.json({
      suggestedTags: uniqueTags,
      createdTags: createdTags,
    });
  } catch (err) {
    console.error('Error generating tags with AI:', err);
    res
      .status(500)
      .json({message: 'Error generating tags', error: err.message});
  }
};

// Helper functions

// Normalize tag name for comparison
function normalizeTagName(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/['"״׳]/g, '') // Remove quotes
    .replace(/\s+/g, ' ') // Normalize spaces
    .replace(/־/g, '-') // Normalize Hebrew dash
    .replace(/׳/g, "'"); // Normalize Hebrew apostrophe
}

// Check if two tags are similar (to avoid duplicates)
function isSimilarTag(existing, newTag, category) {
  const existingNorm = normalizeTagName(existing);
  const newNorm = normalizeTagName(newTag);

  // Exact match after normalization
  if (existingNorm === newNorm) return true;

  // For time-related tags, check if they represent similar ranges
  if (category === 'זמן הכנה') {
    const existingMinutes = extractMinutes(existing);
    const newMinutes = extractMinutes(newTag);
    if (existingMinutes && newMinutes) {
      // Check if the new time falls within existing range
      if (
        newMinutes >= existingMinutes.min &&
        newMinutes <= existingMinutes.max
      ) {
        return true;
      }
    }
  }

  // Check for singular/plural variations
  if (existingNorm.replace(/ים$|ות$/, '') === newNorm.replace(/ים$|ות$/, '')) {
    return true;
  }

  return false;
}

// Extract minutes from time strings like "30-45 דקות" or "40 דק'"
function extractMinutes(timeStr) {
  // Match patterns like "30-45 דקות", "עד 15 דקות", "שעה עד שעתיים"
  const rangeMatch = timeStr.match(/(\d+)\s*-\s*(\d+)/);
  if (rangeMatch) {
    return {min: parseInt(rangeMatch[1]), max: parseInt(rangeMatch[2])};
  }

  const singleMatch = timeStr.match(/(\d+)\s*(דק|דקות|דק')/);
  if (singleMatch) {
    const minutes = parseInt(singleMatch[1]);
    return {min: minutes, max: minutes};
  }

  // Handle "עד X דקות"
  const upToMatch = timeStr.match(/עד\s*(\d+)/);
  if (upToMatch) {
    return {min: 0, max: parseInt(upToMatch[1])};
  }

  // Handle hours
  if (timeStr.includes('שעה') && !timeStr.includes('שעתיים')) {
    return {min: 60, max: 90};
  }
  if (timeStr.includes('שעתיים') || timeStr.includes('שעה עד שעתיים')) {
    return {min: 60, max: 120};
  }
  if (timeStr.includes('מעל שעתיים')) {
    return {min: 120, max: 999};
  }

  return null;
}

// Find a similar existing tag to avoid creating duplicates
function findSimilarExistingTag(categories, newTagName, categoryName) {
  const newNorm = normalizeTagName(newTagName);

  for (const cat of categories) {
    // Prefer matching in the same category
    if (cat.category === categoryName) {
      for (const tag of cat.tags) {
        if (isSimilarTag(tag.he, newTagName, categoryName)) {
          return {...tag.toObject(), category: cat.category};
        }
      }
    }
  }

  // Also check other categories for exact matches
  for (const cat of categories) {
    for (const tag of cat.tags) {
      if (normalizeTagName(tag.he) === newNorm) {
        return {...tag.toObject(), category: cat.category};
      }
    }
  }

  return null;
}

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

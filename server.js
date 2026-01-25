const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('passport');
const dotenv = require('dotenv');
const cloudinary = require('cloudinary').v2;
const path = require('path');
const fs = require('fs');

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

require('./config/passport');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(passport.initialize());

// Middleware ללוג שגיאות (אופציונלי)
app.use((err, req, res, next) => {
  console.log(err);
  next();
});

// Database connection
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log('MongoDB connected ✅');

    // Auto-seed tags on first run
    // try {
    //   const Tag = require('./models/Tag');
    //   const existingTags = await Tag.countDocuments();

    //   if (existingTags === 0) {
    //     console.log('🌱 First run detected. No tags found - please run: npm run seed:tags');
    //   } else {
    //     console.log(`✅ Tags loaded: ${existingTags} categories available`);
    //   }
    // } catch (err) {
    //   console.log('ℹ️  Tag check skipped');
    // }
  })
  .catch(err => console.log(err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/recipes', require('./routes/recipes'));
app.use('/api/tags', require('./routes/tags'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/groq', require('./routes/groq'));

const reactBuildPath = path.join(__dirname, 'client/build');
const Recipe = require('./models/Recipe');

const reactOptions = {
  redirect: false,
  setHeaders: function (res, path, stat) {
    res.set('Cache-Control', 'no-cache');
  },
  extensions: ['html', 'htm'],
};

app.use(express.static(path.join(__dirname, 'client')));
app.use(express.static(reactBuildPath, reactOptions));

// Open Graph meta tags for recipe sharing (WhatsApp, Facebook, Twitter, etc.)
app.get('/recipe/:shortId', async (req, res) => {
  try {
    const {shortId} = req.params;
    const recipe = await Recipe.findOne({shortId, isDeleted: false});

    // Read the index.html file
    const indexPath = path.join(reactBuildPath, 'index.html');
    let html = fs.readFileSync(indexPath, 'utf8');

    if (recipe && recipe.visibility === 'Public') {
      // Escape special characters for HTML
      const escapeHtml = str =>
        str
          ? str
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
          : '';

      const title = escapeHtml(recipe.title) || 'RecipeMaster';
      const description =
        escapeHtml(recipe.description?.substring(0, 200)) ||
        'מתכון טעים ב-RecipeMaster';
      const image =
        recipe.mainImage ||
        'https://res.cloudinary.com/recipemaster/image/upload/v1/recipemaster/default-recipe.jpg';
      const url = `${process.env.BASE_URL || 'https://recipemaster.onrender.com'}/recipe/${shortId}`;

      // Create OG meta tags
      const ogTags = `
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${url}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:site_name" content="RecipeMaster" />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${url}" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${image}" />

    <!-- WhatsApp specific -->
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
`;

      // Inject OG tags before </head>
      html = html.replace('</head>', `${ogTags}</head>`);

      // Update title tag
      html = html.replace(
        /<title>.*?<\/title>/,
        `<title>${title} | RecipeMaster</title>`,
      );
    }

    res.send(html);
  } catch (err) {
    console.error('Error generating OG tags:', err);
    // Fallback to regular index.html
    res.sendFile(path.join(reactBuildPath, 'index.html'));
  }
});

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(reactBuildPath, 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

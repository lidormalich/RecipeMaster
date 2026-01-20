const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('passport');
const dotenv = require('dotenv');
const cloudinary = require('cloudinary').v2;
const path = require('path');

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
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/recipes', require('./routes/recipes'));
app.use('/api/tags', require('./routes/tags'));
app.use('/api/admin', require('./routes/admin'));

// // Serve static assets in production
// if (process.env.NODE_ENV === 'production') {
//   app.use(express.static('client/build'));
//   app.get('*', (req, res) => {
//     res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
//   });
// }

// --- הגדרת קבצים סטטיים (React) ---

// נתיב לתיקיית ה-Build של הריאקט
const reactBuildPath = path.join(__dirname, 'client/build');

const reactOptions = {
  redirect: false,
  setHeaders: function (res, path, stat) {
    res.set('Cache-Control', 'no-cache');
  },
  extensions: ['html', 'htm'],
};

// 1. שרת את הקבצים הסטטיים הכלליים (אם יש)
app.use(express.static(path.join(__dirname, 'client')));

// 2. שרת את קבצי הריאקט הסטטיים
app.use(express.static(reactBuildPath, reactOptions));

// 3. נתיב catch-all עבור SPA (Single Page Application)
// כל בקשה שלא טופלה ע"י ה-API או הקבצים הסטטיים תגיע לפה
app.get('*', (req, res, next) => {
  // אם הבקשה מתחילה ב-/api, אל תחזיר את ה-HTML אלא תעביר לטיפול שגיאות (או 404)
  if (req.path.startsWith('/api')) {
    return next();
  }

  // אחרת, החזר את קובץ ה-index.html של הריאקט
  res.sendFile(path.join(reactBuildPath, 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

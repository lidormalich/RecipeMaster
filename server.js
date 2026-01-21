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
app.use('/api/cart', require('./routes/cart'));
app.use('/api/upload', require('./routes/upload'));

const reactBuildPath = path.join(__dirname, 'client/build');

const reactOptions = {
  redirect: false,
  setHeaders: function (res, path, stat) {
    res.set('Cache-Control', 'no-cache');
  },
  extensions: ['html', 'htm'],
};

app.use(express.static(path.join(__dirname, 'client')));
app.use(express.static(reactBuildPath, reactOptions));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(reactBuildPath, 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

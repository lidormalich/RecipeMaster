const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const auth = require('../middleware/auth');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer to use memory storage
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  },
});

// @route   POST /api/upload
// @desc    Upload image to Cloudinary
// @access  Private
router.post('/', auth, (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.log('=== MULTER ERROR ===', err.message);
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({msg: 'File too large. Max size is 5MB'});
        }
        return res.status(400).json({msg: `Upload error: ${err.message}`});
      }
      return res.status(400).json({msg: err.message});
    }
    next();
  });
}, async (req, res) => {
  try {
    console.log('=== UPLOAD REQUEST STARTED ===');
    console.log('User:', req.user?.id);
    console.log('Headers content-type:', req.headers['content-type']);

    if (!req.file) {
      console.log('ERROR: No file in request');
      return res.status(400).json({msg: 'No file uploaded'});
    }

    console.log('File received:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      bufferLength: req.file.buffer?.length || 0,
    });

    // Check Cloudinary config
    console.log('Cloudinary config check:', {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? 'SET' : 'MISSING',
      api_key: process.env.CLOUDINARY_API_KEY ? 'SET' : 'MISSING',
      api_secret: process.env.CLOUDINARY_API_SECRET ? 'SET' : 'MISSING',
    });

    // Validate file size
    if (req.file.size > 10 * 1024 * 1024) {
      return res.status(400).json({msg: 'File too large. Max size is 10MB'});
    }

    console.log('Starting upload to Cloudinary...');

    // Try to upload directly with buffer
    try {
      // Option 1: Try with data URI
      const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

      const result = await cloudinary.uploader.upload(dataUri, {
        folder: 'recipemaster',
        resource_type: 'auto',
        timeout: 60000,
        invalidate: true,
      });

      console.log('Upload successful:', result.secure_url);
      res.json({
        url: result.secure_url,
        publicId: result.public_id,
      });
    } catch (cloudinaryError) {
      console.error('First upload attempt failed:', cloudinaryError.message);
      console.error('Full Cloudinary error:', JSON.stringify(cloudinaryError, null, 2));

      // Option 2: If first attempt fails, try without mimetype validation
      try {
        console.log('Trying alternative upload method...');
        const base64Data = req.file.buffer.toString('base64');

        const result = await cloudinary.uploader.upload(
          `data:image/png;base64,${base64Data}`,
          {
            folder: 'recipemaster',
            timeout: 60000,
            invalidate: true,
          },
        );

        console.log(
          'Upload successful with alternative method:',
          result.secure_url,
        );
        res.json({
          url: result.secure_url,
          publicId: result.public_id,
        });
      } catch (secondError) {
        console.error('Second upload attempt also failed:', secondError.message);
        console.error('Full second error:', JSON.stringify(secondError, null, 2));
        throw cloudinaryError; // Throw the original error
      }
    }
  } catch (err) {
    console.error('Server error:', err);
    res
      .status(500)
      .json({msg: 'Server error during file upload', error: err.message});
  }
});

module.exports = router;

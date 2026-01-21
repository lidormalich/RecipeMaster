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
    fileSize: 5 * 1024 * 1024, // 5MB limit
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
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({msg: 'No file uploaded'});
    }

    console.log('File received:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      bufferLength: req.file.buffer.length,
    });

    // Validate file size
    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({msg: 'File too large. Max size is 5MB'});
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
        console.error('Second upload attempt also failed:', secondError);
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

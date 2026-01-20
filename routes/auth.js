const express = require('express');
const {body} = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const passport = require('passport');

router.post(
  '/register',
  [
    body('name', 'Name is required').not().isEmpty(),
    body('email', 'Please include a valid email').isEmail(),
    body(
      'password',
      'Please enter a password with 6 or more characters',
    ).isLength({min: 6}),
  ],
  authController.register,
);

router.post('/login', authController.login);

router.get('/me', auth, authController.getMe);

router.get(
  '/google',
  passport.authenticate('google', {scope: ['profile', 'email']}),
);

router.get(
  '/google/callback',
  passport.authenticate('google', {failureRedirect: '/login'}),
  authController.googleAuthCallback,
);

module.exports = router;

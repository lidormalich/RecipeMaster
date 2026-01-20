const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {validationResult} = require('express-validator');
const User = require('../models/User');

exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({errors: errors.array()});
  }

  const {name, email, password} = req.body;

  try {
    let user = await User.findOne({email});
    if (user) {
      return res.status(400).json({message: 'User already exists'});
    }

    user = new User({
      name,
      email,
      password,
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      {expiresIn: '1h'},
      (err, token) => {
        if (err) throw err;
        res.json({token});
      },
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.login = async (req, res) => {
  const {email, password} = req.body;

  try {
    let user = await User.findOne({email});
    if (!user) {
      return res.status(400).json({message: 'Invalid credentials'});
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({message: 'Invalid credentials'});
    }

    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      {expiresIn: '1h'},
      (err, token) => {
        if (err) throw err;
        res.json({token});
      },
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.googleAuthCallback = (req, res) => {
  const payload = {
    user: {
      id: req.user.id,
    },
  };
  jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: '1h'}, (err, token) => {
    if (err) throw err;
    res.redirect(`${process.env.CLIENT_URL}/?token=${token}`);
  });
};

const User = require('../models/User');
const bcrypt = require('bcryptjs');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({createdAt: -1});
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.updateUserRole = async (req, res) => {
  const {userId, role} = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({message: 'User not found'});
    }

    user.role = role;
    await user.save();

    res.json({message: 'Role updated successfully'});
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.suspendUser = async (req, res) => {
  const {userId, suspended} = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({message: 'User not found'});
    }

    // Don't allow suspending admins
    if (user.role === 'Admin') {
      return res.status(400).json({message: 'Cannot suspend admin users'});
    }

    user.suspended = suspended;
    await user.save();

    res.json({message: suspended ? 'User suspended' : 'User unsuspended', suspended});
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.resetPassword = async (req, res) => {
  const {userId, newPassword} = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({message: 'User not found'});
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({message: 'Password reset successfully'});
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.deleteUser = async (req, res) => {
  const {userId} = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({message: 'User not found'});
    }

    // Don't allow deleting admins
    if (user.role === 'Admin') {
      return res.status(400).json({message: 'Cannot delete admin users'});
    }

    await User.findByIdAndDelete(userId);

    res.json({message: 'User deleted successfully'});
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

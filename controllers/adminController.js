const User = require('../models/User');

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

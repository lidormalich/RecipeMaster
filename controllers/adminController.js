const User = require('../models/User');
const bcrypt = require('bcryptjs');
const Recipe = require('../models/Recipe');
const AuditLog = require('../models/AuditLog');
const {logAudit} = require('../utils/logActivity');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({createdAt: -1}).lean();

    // Attach a recipe count per user (single aggregation, then map)
    const recipeCounts = await Recipe.aggregate([
      {$match: {isDeleted: false}},
      {$group: {_id: '$author', count: {$sum: 1}}},
    ]);
    const countMap = new Map(recipeCounts.map(r => [String(r._id), r.count]));

    const enriched = users.map(u => ({
      ...u,
      recipeCount: countMap.get(String(u._id)) || 0,
    }));

    res.json(enriched);
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

    const previousRole = user.role;
    user.role = role;
    await user.save();

    logAudit({
      req,
      admin: req.user,
      action: 'role_change',
      targetUser: user,
      details: {from: previousRole, to: role},
    });

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

    logAudit({
      req,
      admin: req.user,
      action: suspended ? 'suspend' : 'unsuspend',
      targetUser: user,
    });

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

    // Audit records only that a reset happened — never the password itself
    logAudit({req, admin: req.user, action: 'reset_password', targetUser: user});

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

    logAudit({
      req,
      admin: req.user,
      action: 'delete_user',
      targetUser: user,
      details: {email: user.email, role: user.role},
    });

    res.json({message: 'User deleted successfully'});
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// GET /api/admin/audit-log — paginated trail of sensitive admin actions
exports.getAuditLog = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(parseInt(req.query.limit) || 30, 100);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.action) filter.action = req.query.action;

    const [entries, total] = await Promise.all([
      AuditLog.find(filter).sort({createdAt: -1}).skip(skip).limit(limit).lean(),
      AuditLog.countDocuments(filter),
    ]);

    res.json({
      entries,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

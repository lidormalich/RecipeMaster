const mongoose = require('mongoose');

// Records sensitive administrative actions for accountability.
// Never stores passwords or tokens — only the fact that an action occurred.
const auditLogSchema = new mongoose.Schema({
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  adminName: {
    type: String,
  },
  action: {
    type: String,
    required: true,
    enum: [
      'role_change',
      'suspend',
      'unsuspend',
      'reset_password',
      'delete_user',
    ],
    index: true,
  },
  targetUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  targetName: {
    type: String,
  },
  // e.g. { from: 'User', to: 'Admin' }
  details: {
    type: mongoose.Schema.Types.Mixed,
  },
  ip: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

auditLogSchema.index({createdAt: -1});

module.exports = mongoose.model('AuditLog', auditLogSchema);

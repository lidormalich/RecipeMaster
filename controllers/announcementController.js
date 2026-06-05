const Announcement = require('../models/Announcement');

// GET /api/announcements/active — public: the current banner (if any)
exports.getActive = async (req, res) => {
  try {
    const now = new Date();
    const announcement = await Announcement.findOne({
      active: true,
      $or: [{expiresAt: null}, {expiresAt: {$gt: now}}],
    })
      .sort({createdAt: -1})
      .select('message type createdAt')
      .lean();

    res.json(announcement || null);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// GET /api/announcements — admin: full list
exports.list = async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({createdAt: -1}).lean();
    res.json(announcements);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// POST /api/announcements — admin: create a banner
exports.create = async (req, res) => {
  try {
    const {message, type, expiresAt} = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({message: 'נדרש תוכן הודעה'});
    }

    const announcement = await Announcement.create({
      message: message.trim().slice(0, 300),
      type: ['info', 'warning', 'success'].includes(type) ? type : 'info',
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdBy: req.user.id,
      createdByName: req.user.name,
    });

    res.json(announcement);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// PATCH /api/announcements/:id — admin: toggle active state
exports.update = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({message: 'ההודעה לא נמצאה'});
    }
    if (typeof req.body.active === 'boolean') {
      announcement.active = req.body.active;
    }
    await announcement.save();
    res.json(announcement);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// DELETE /api/announcements/:id — admin: remove
exports.remove = async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({message: 'ההודעה נמחקה'});
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

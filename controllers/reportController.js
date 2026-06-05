const Report = require('../models/Report');
const Recipe = require('../models/Recipe');

// POST /api/reports — a logged-in user flags a recipe
exports.createReport = async (req, res) => {
  try {
    const {targetId, reason} = req.body;
    if (!targetId || !reason || !reason.trim()) {
      return res.status(400).json({message: 'נדרשים מתכון וסיבת דיווח'});
    }

    const recipe = await Recipe.findOne({
      shortId: {$regex: new RegExp(`^${targetId}$`, 'i')},
    }).select('title shortId');

    if (!recipe) {
      return res.status(404).json({message: 'המתכון לא נמצא'});
    }

    // Prevent duplicate open reports from the same user on the same recipe
    const existing = await Report.findOne({
      reporter: req.user.id,
      targetId: recipe.shortId,
      status: 'open',
    });
    if (existing) {
      return res.status(200).json({message: 'כבר דיווחת על מתכון זה'});
    }

    await Report.create({
      reporter: req.user.id,
      reporterName: req.user.name,
      targetType: 'recipe',
      targetId: recipe.shortId,
      recipeTitle: recipe.title,
      reason: reason.trim().slice(0, 500),
    });

    res.json({message: 'הדיווח נשלח. תודה!'});
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// GET /api/reports — admin list, filterable by status
exports.getReports = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(parseInt(req.query.limit) || 30, 100);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const [entries, total, openCount] = await Promise.all([
      Report.find(filter).sort({createdAt: -1}).skip(skip).limit(limit).lean(),
      Report.countDocuments(filter),
      Report.countDocuments({status: 'open'}),
    ]);

    res.json({entries, page, limit, total, openCount, totalPages: Math.ceil(total / limit)});
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// PATCH /api/reports/:id — admin resolves or dismisses a report
exports.updateReport = async (req, res) => {
  try {
    const {status} = req.body;
    if (!['resolved', 'dismissed', 'open'].includes(status)) {
      return res.status(400).json({message: 'סטטוס לא תקין'});
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({message: 'הדיווח לא נמצא'});
    }

    report.status = status;
    if (status === 'open') {
      report.resolvedBy = null;
      report.resolvedByName = null;
      report.resolvedAt = null;
    } else {
      report.resolvedBy = req.user.id;
      report.resolvedByName = req.user.name;
      report.resolvedAt = new Date();
    }
    await report.save();

    res.json({message: 'הדיווח עודכן', status});
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

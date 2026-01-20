const Tag = require('../models/Tag');

exports.getTags = async (req, res) => {
  try {
    const tags = await Tag.find();
    res.json(tags);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.createTag = async (req, res) => {
  const {name, category} = req.body;

  try {
    let tag = await Tag.findOne({name});
    if (tag) {
      return res.status(400).json({message: 'Tag already exists'});
    }

    tag = new Tag({
      name,
      category,
    });

    await tag.save();
    res.json(tag);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.updateTag = async (req, res) => {
  try {
    const tag = await Tag.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(tag);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.deleteTag = async (req, res) => {
  try {
    await Tag.findByIdAndDelete(req.params.id);
    res.json({message: 'Tag deleted'});
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

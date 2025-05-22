const Story = require('../models/Story');

// Show all stories
exports.listStories = async (req, res) => {
  const stories = await Story.find().sort({ createdAt: -1 });
  res.render('stories/list', { stories });
};

// New story form
exports.newStoryForm = (req, res) => {
  res.render('stories/new', { story: null });
};

// Create new story
exports.createStory = async (req, res) => {
  const { title, content } = req.body;
  await Story.create({ title, content, createdBy: req.session.user.id });
  res.redirect('/stories');
};

// Show single story
exports.viewStory = async (req, res) => {
  const story = await Story.findById(req.params.id);
  res.render('stories/view', { story });
};

// Edit story form
exports.editStoryForm = async (req, res) => {
  const story = await Story.findById(req.params.id);
  res.render('stories/edit', { story });
};

// Update story
exports.updateStory = async (req, res) => {
  const { title, content } = req.body;
  await Story.findByIdAndUpdate(req.params.id, { title, content });
  res.redirect('/stories');
};

// Delete story
exports.deleteStory = async (req, res) => {
  await Story.findByIdAndDelete(req.params.id);
  res.redirect('/stories');
};

const Event = require('../models/Event');
const cloudinary = require('../utils/cloudinary');

exports.getAllEvents = async (req, res) => {
  const events = await Event.find().sort({ date: -1 });
  res.render('events/list', { events });
};

exports.getUpcomingEvents = async () => {
  return await Event.find({ date: { $gte: new Date() } }).sort({ date: 1 }).limit(5);
};

exports.renderAddEvent = (req, res) => {
  res.render('events/add');
};

exports.createEvent = async (req, res) => {
  try {
    let imageUrl = '';
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path);
      imageUrl = result.secure_url;
    }

    await Event.create({
      title: req.body.title,
      description: req.body.description,
      date: req.body.date,
      imageUrl,
    });

    res.redirect('/events');
  } catch (error) {
    console.error(error);
    res.redirect('/events');
  }
};

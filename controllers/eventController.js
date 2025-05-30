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

exports.viewEvent = async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).send('Event not found');
  res.render('events/view', { event });
};

exports.renderEditForm = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).send('Event not found');
    res.render('events/edit', { event });
  } catch (err) {
    res.status(500).send('Error loading event edit form');
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const { title, date, description } = req.body;
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).send('Event not found');

    // Update fields
    event.title = title;
    event.date = date;
    event.description = description;

    // If a new image is uploaded
    if (req.file) {
      // Optional: delete old image from Cloudinary if stored (future improvement)

      // Upload new image
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'phagwara-yog-zila/events',
      });
      event.imageUrl = result.secure_url;
    }

    await event.save();
    res.redirect(`/events/${event._id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating event');
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.redirect('/events');
  } catch (err) {
    res.status(500).send('Error deleting event');
  }
};
